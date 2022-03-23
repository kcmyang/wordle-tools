// Get average guesses, rounded to one decimal place, as a string.
function getAverageGuessesFromDistribution(distribution) {
  let totalGuesses = 0;
  let numGames = 0;
  let weight = 1;

  for (const bar of distribution.getElementsByClassName("graph-container")) {
    const count = parseInt(
      bar.getElementsByClassName("num-guesses")[0].innerText
    );
    totalGuesses += weight * count;
    numGames += count;
    weight += 1;
  }

  return ((((totalGuesses / numGames) * 10) << 0) / 10).toFixed(1);
}

// Create the average guesses DOM element.
function createAverageGuessesElement(stats) {
  const statistic = document.createElement("div");
  statistic.className = "statistic";
  statistic.innerText = stats.averageGuesses;

  const label = document.createElement("div");
  label.className = "label";
  label.innerText = "Average Guesses";

  const div = document.createElement("div");
  div.className = "statistic-container";
  div.append(statistic, label);

  return div;
}

// Run the content script.
function run() {
  // A deplorable hack to get the modal. :)
  // prettier-ignore
  const gameModal =
    document.getRootNode()
      .childNodes[1] // <html>
      .childNodes[2] // <body>
      .childNodes[8] // <game-app>
      .shadowRoot
      .childNodes[3] // <game-theme-manager>
      .childNodes[3] // <div#game>
      .childNodes[7]; // <game-modal>

  const observerConfig = { childList: true };

  let stats = {
    averageGuesses: 0,
  };

  const callback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          // Game stats are showing? Scrape them and show the average
          if (node.nodeName === "GAME-STATS") {
            const shadow = chrome.dom.openOrClosedShadowRoot(node);
            const statistics = shadow.getElementById("statistics");
            const distribution = shadow.getElementById("guess-distribution");

            // Compute the average guesses
            stats.averageGuesses =
              getAverageGuessesFromDistribution(distribution);

            // Add the average guesses to the statistics
            statistics.append(createAverageGuessesElement(stats));

            // The inner loop should only run at most once, but break
            // anyway to save computation
            break;
          }
        }
      }
    }
  };

  const observer = new MutationObserver(callback);

  observer.observe(gameModal, observerConfig);
}

run();
