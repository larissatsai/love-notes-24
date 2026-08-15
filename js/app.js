async function loadAbout() {
  const response = await fetch("content/about.md");
  if (!response.ok) throw new Error("Could not load about content");
  const markdown = await response.text();
  document.getElementById("about-content").innerHTML = renderMarkdown(markdown);
}

async function loadNotes() {
  const response = await fetch("content/notes.json");
  if (!response.ok) throw new Error("Could not load notes");
  return response.json();
}

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)$/;

function resolveContentPath(path) {
  const trimmed = path.trim();
  if (/^(https?:\/\/|\/)/.test(trimmed)) {
    return trimmed;
  }
  return `content/${trimmed.replace(/^\.\//, "")}`;
}

function renderMarkdown(text) {
  const lines = text.trim().split("\n");
  let html = "";
  let paragraph = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    html += `<p>${paragraph.join(" ")}</p>`;
    paragraph = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    const imageMatch = trimmed.match(IMAGE_LINE);

    if (trimmed.startsWith("# ")) {
      flushParagraph();
      html += `<h1>${escapeHtml(trimmed.slice(2))}</h1>`;
    } else if (imageMatch) {
      flushParagraph();
      const alt = escapeHtml(imageMatch[1]);
      const src = escapeHtml(resolveContentPath(imageMatch[2]));
      html += `<figure class="about-figure"><img class="about-image" src="${src}" alt="${alt}" loading="lazy" />`;
      if (alt) {
        html += `<figcaption class="about-caption">${alt}</figcaption>`;
      }
      html += "</figure>";
    } else if (trimmed === "") {
      flushParagraph();
    } else {
      paragraph.push(escapeHtml(trimmed));
    }
  }

  flushParagraph();
  return html;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function findNote(notesData, name) {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  for (const [key, note] of Object.entries(notesData.notes)) {
    if (key.trim().toLowerCase() === normalized) {
      return note;
    }
  }

  return notesData.default;
}

function showNote(text, name) {
  const reveal = document.getElementById("note-reveal");
  const noteText = document.getElementById("love-note-text");
  const noteFor = document.getElementById("note-for");

  noteFor.textContent = name.trim()
    ? `hey ${name.trim()}, this one's for you ♡`
    : "hey you, this one's for you ♡";
  noteText.textContent = text;

  reveal.classList.remove("visible");
  void reveal.offsetWidth;
  reveal.classList.add("visible");
  reveal.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function init() {
  let notesData;

  try {
    await loadAbout();
    notesData = await loadNotes();
  } catch (error) {
    document.getElementById("about-content").innerHTML =
      "<p>Could not load content. Make sure you are running a local server (see README).</p>";
    console.error(error);
    return;
  }

  const form = document.getElementById("note-form");
  const nameInput = document.getElementById("name-input");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();

    if (!name) {
      nameInput.focus();
      return;
    }

    const note = findNote(notesData, name);
    if (note) {
      showNote(note, name);
    }
  });
}

init();
