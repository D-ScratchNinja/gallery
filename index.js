import projects from "./content.js";

let lastRandomPick;

function addProjectToList(data) {
  const newItem = document.getElementById("template-project_card").content.cloneNode(true);
  const aElem = newItem.firstElementChild.firstElementChild;

  // Link
  aElem.href =
    `https://scratch.mit.edu/projects/${data.id}`;

  // Image source
  aElem.firstElementChild.src =
    `https://uploads.scratch.mit.edu/get_image/project/${data.id}_480x360.png`;

  // Alt text for image
  aElem.firstElementChild.alt = `Thumbnail for project ${data.title}`;

  // Title of project
  aElem.lastElementChild.textContent = data.title;


  // (Debugging) Tags of project
  // newItem.firstElementChild.lastElementChild.textContent = data.tags.join(", ");


  // Metadata
  newItem.firstElementChild.dataset.item_keywords = data.title.toLowerCase();
  newItem.firstElementChild.dataset.item_tags = data.tags + ",";
  newItem.firstElementChild.dataset.event_specific = data.eventSpecific ?? false;

  document.getElementById("list").appendChild(newItem);
}

function filterList(keywords, tag) {
  // Gray out the "Search or filter..." button if filters are active
  if (keywords === "" && tag === "") {
    document.getElementById("btn-filter").removeAttribute("disabled");
    document.getElementById("btn-filter").removeAttribute("title");
  } else {
    document.getElementById("btn-filter").setAttribute("disabled", "");
    document.getElementById("btn-filter").setAttribute("title", "Filters active");
  }

  let count = 0;
  for (const element of document.querySelectorAll(".card")) {
    const matches = (
      // Is in the selected category
      element.dataset.item_tags.includes(tag + ",")
      // Name contains search query
      && keywords.match(/\w+/g).every((w) => element.dataset.item_keywords.includes(w))
      // Is related to the selected event (e.g. April Fools) or is not related to an event
      && (
        element.dataset.event_specific !== "true"
        || (tag !== "" && element.dataset.item_tags.includes(tag + ","))
      )
    );
    element.dataset.exclude = !matches;
    if (matches) count++;
  }

  if (count) {
    document.getElementById("no_results").setAttribute("hidden", "hidden");
    lastRandomPick = undefined;
  } else {
    document.getElementById("no_results").removeAttribute("hidden");
  }
}

const elements = {
  filtersRow: document.getElementById("filters_row"),
  topButton: document.querySelector(".top_button"),
}
let filter = "";

// Do a search whenever something is typed into the search bar
document.querySelector("input").addEventListener(
  "input",
  (e) => {
    filterList(e.target.value.toLowerCase(), filter);
  },
  { passive: true },
);

// Build the list
for (const i of projects) {
  addProjectToList(i);
}

// Show all results initially
filterList("", filter);

// Show filters button
document.getElementById("btn-filter").addEventListener("click", (e) => {
  const filtersRow = elements.filtersRow;
  e.target.ariaPressed = !filtersRow.toggleAttribute("data-hidden");
});

// Random item button (link)
document.getElementById("btn-random").addEventListener("click", (e) => {
  e.preventDefault(); // Prevent following link "#"
  const items = document.querySelectorAll(".card:not([data-exclude=true])");
  if (items.length) {
    // Pick a random item
    const number = items.length === 1
      ? 0 // Only one possible outcome, easy
      : typeof lastRandomPick === "number"
        ? (lastRandomPick + 1 + Math.floor(Math.random() * (items.length - 1))) % items.length // Don't roll the same item twice in a row
        : Math.floor(Math.random() * items.length);
    lastRandomPick = number;

    items[number].style.animation = "bounce 0.2s 6 alternate cubic-bezier(0.25, 0.62, 0.62, 0.97)";
    items[number].classList.add("chosen");
    items[number].addEventListener(
      "animationend",
      () => {
        items[number].style.removeProperty("animation");
        items[number].classList.remove("chosen");
      },
      { once: true },
    );
    if (e.isTrusted) {
      items[number].firstElementChild.focus({ focusVisible: true });
    }
  }
});

// Show more filter options if certain filters are set
elements.filtersRow.querySelector("select").addEventListener("change", (e) => {
  elements.filtersRow.querySelectorAll("select[data-if]").forEach(element => element.setAttribute("data-hidden", ""));
  if (e.target.value === "game") {
    elements.filtersRow.querySelector("select[data-if='game']").removeAttribute("data-hidden");
  }
});

// Other filter dropdowns
elements.filtersRow.querySelectorAll("select").forEach(element => {
  element.addEventListener("change", () => {
    const filterFields = elements.filtersRow.querySelectorAll("select");
    switch (filterFields[0].value) {
      case "game": {
        filter = filterFields[1].value === "" ? "game" : "game_" + filterFields[1].value;
        break;
      }
      default: filter = filterFields[0].value;
    }
    filterList(document.querySelector("input").value.toLowerCase(), filter);
  });
});

// When submitting search
document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!e.isTrusted) return;
  try { document.querySelector(".card:not([data-exclude=true]) a").focus(); } catch {
    // If we can't find an element corresponding to a displayed result (means there are no results)...
    document.getElementById("no_results").focus();
  }
});

// Clear search query when pressing Esc
document.querySelector("input").addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.target.value = "";
    filterList("", filter);
  }
});

// Focus search bar when pressing Enter on "No results"
document.getElementById("no_results").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (e.isTrusted) document.querySelector("input").select();
  };
});

function focusSearchBar(event) {
  event.preventDefault();
  if (elements.filtersRow.hasAttribute("data-hidden")) document.getElementById("btn-filter").click(); // Show filters
  document.querySelector("input").focus();
  document.querySelector("input").select();
}

// Global keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Only when focus is outside of the search bar
  if (!e.target.closest("input, dialog")) {
    switch (e.key) {
      case "/": {
        focusSearchBar(e);
        break;
      }
    }
    switch (e.key) {
      case "k": {
        if (e.ctrlKey || e.metaKey) {
          focusSearchBar(e);
          break;
        }
      }
    }
    switch (e.key) {
      case "f": {
        if (e.ctrlKey || e.metaKey) {
          focusSearchBar(e);
          break;
        }
      }
    }
  }
});

document.querySelectorAll("[data-action='modal-privacy']").forEach(elem => elem.addEventListener("click", (e) => {
  e.preventDefault(); // Prevent following link "#"
  document.querySelector("dialog").showModal();
}));

// Dialog close buttons
document.querySelectorAll("dialog").forEach(element => {
  element.querySelector("button").addEventListener("click", () => {
    element.close();
  });
});

// Show "Back to top" button if you've scrolled past a certain point
document.addEventListener("scroll", () => {
  const show = window.scrollY > 300;
  elements.topButton.style.pointerEvents = show ? "all" : "none";
  elements.topButton.style.opacity = show ? 1 : 0;
  elements.topButton.tabindex = show ? 0 : -1;
});

// "Back to top" button
elements.topButton.addEventListener("click", () => {
  // Remove the fragment from the current URL, if there is one
  const currentURL = new URL(location);
  if (currentURL.hash) {
    let target = currentURL;
    target.hash = "";
    history.pushState({}, "", target);
  }

  window.scrollTo(0, 0);
  document.querySelector(".card:not([data-exclude=true]) a").focus();
});

// "Skip to content" button
document.querySelector(".skip_button").addEventListener("click", () => {
  document.querySelector(".card:not([data-exclude=true]) a").focus();
});

// Event-specific categories
function addCategoryOption(value, name) {
  const newOption = document.createElement("option");
  newOption.value = value;
  newOption.textContent = name;
  elements.filtersRow.querySelector("select").querySelector('option[value=""]').insertAdjacentElement("afterend", newOption);
}
const date = new Date();
const stamp = {
  date: date.getDate(),
  month: date.getMonth() + 1,
};
if (stamp.month === 4 && stamp.date === 1) addCategoryOption("aprilfools", "📅 April Fools");
