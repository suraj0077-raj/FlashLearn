/* =========================================================
   1. DOM HELPER FUNCTIONS
   ========================================================= */

/**
 * Select the first element matching a CSS selector.
 */
const $ = (s) => document.querySelector(s);

/**
 * Select all elements matching a CSS selector
 * and convert the result into a normal Array.
 */
const $$ = (s) => [...document.querySelectorAll(s)];


/* =========================================================
   2. APPLICATION STATE
   ========================================================= */

/**
 * Load the saved application state from localStorage.
 * If no saved state exists, use the default state below.
 */
let state =
    JSON.parse(localStorage.getItem("flashlearnState") || "null") || {
        goal: 20,
        studied: 0,
        streak: 1,
        best: 1,
        mastered: 0,
        sound: true,
        dark: false,

        decks: [
            {
                id: 1,
                category: "Programming",
                title: "JavaScript Mastery & ES6+",
                description:
                    "Master core JavaScript concepts, async patterns, closures, and modern ES6+ features.",

                cards: [
                    [
                        "What is a closure in JavaScript?",
                        "A function that remembers variables from its outer lexical scope."
                    ],
                    [
                        "What does async/await do?",
                        "It provides cleaner syntax for working with Promises."
                    ],
                    [
                        "What is const?",
                        "A block-scoped binding that cannot be reassigned."
                    ]
                ]
            },

            {
                id: 2,
                category: "Languages",
                title: "Spanish Vocabulary & Conversational...",
                description:
                    "Essential conversational phrases, high-frequency verbs, and everyday Spanish vocabulary.",

                cards: [
                    ["How do you say Hello?", "Hola"],
                    ["How do you say Thank you?", "Gracias"],
                    ["What does 'Buenos días' mean?", "Good morning"],
                    ["What does 'Por favor' mean?", "Please"],
                    ["How do you say Goodbye?", "Adiós"]
                ]
            },

            {
                id: 3,
                category: "History",
                title: "World History Milestones",
                description:
                    "Pivotal historical events, treaties, and turning points that shaped the modern world.",

                cards: [
                    ["When did World War II end?", "1945"],
                    ["When was the French Revolution?", "1789"],
                    ["Who was the first person on the Moon?", "Neil Armstrong"],
                    ["When was the United Nations founded?", "1945"],
                    ["When did the Berlin Wall fall?", "1989"]
                ]
            }
        ]
    };


/* =========================================================
   3. CURRENT APPLICATION VARIABLES
   ========================================================= */

/**
 * Currently selected category filter.
 */
let activeFilter = "All";

/**
 * Currently selected deck.
 */
let activeDeck = null;

/**
 * Index of the currently displayed flashcard.
 */
let cardIndex = 0;

/**
 * Whether the current flashcard is showing its answer.
 */
let flipped = false;


/* =========================================================
   4. STORAGE
   ========================================================= */

/**
 * Save the complete application state to localStorage.
 */
function save() {
    localStorage.setItem(
        "flashlearnState",
        JSON.stringify(state)
    );
}


/* =========================================================
   5. GENERAL UTILITY FUNCTIONS
   ========================================================= */

/**
 * Return the total number of cards across every deck.
 */
function totalCards() {
    return state.decks.reduce(
        (total, deck) => total + deck.cards.length,
        0
    );
}


/**
 * Display a temporary toast notification.
 */
function showToast(msg) {
    const t = $("#toast");

    t.textContent = msg;
    t.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        t.classList.remove("show");
    }, 2200);
}


/**
 * Escape HTML-sensitive characters before inserting
 * user-provided text into innerHTML.
 */
function esc(s) {
    return s.replace(
        /[&<>"']/g,
        (m) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[m])
    );
}


/* =========================================================
   6. DASHBOARD STATISTICS
   ========================================================= */

/**
 * Update all dashboard statistics and progress bars.
 */
function renderStats() {
    const total = totalCards();

    const pct = total
        ? Math.round((state.mastered / total) * 100)
        : 0;

    const goalPct = Math.min(
        100,
        (state.studied / state.goal) * 100
    );

    // Daily goal
    $("#goalCount").textContent = state.studied;

    // $("goalTotal").textContent = state.goal;

    $("#remaining").textContent =
        `${Math.max(0, state.goal - state.studied)} cards remaining`;

    $("#goalBar").style.width = `${goalPct}%`;

    $("#headerGoal").textContent = state.studied;
    $("#headerGoalBar").style.width = `${goalPct}%`;

    // Streak
    $("#streakCount").textContent = state.streak;
    $("#headerStreak").textContent = state.streak;

    $("#bestStreak").textContent =
        `${state.best} day${state.best !== 1 ? "s" : ""}`;

    // Deck/card counts
    $("#deckCount").textContent = state.decks.length;
    $("#cardTotal").textContent = total;

    // Mastery
    $("#mastery").textContent = `${pct}%`;
    $("#masteredCount").textContent = state.mastered;
}


/* =========================================================
   7. DECK RENDERING
   ========================================================= */

/**
 * Render all decks according to the active category filter
 * and current search query.
 */
function renderDecks() {
    const q = $("#searchInput").value.trim().toLowerCase();

    /**
     * Filter decks by:
     * 1. Category
     * 2. Search query
     */
    const decks = state.decks.filter((d) => {
        const matchesCategory =
            activeFilter === "All" ||
            d.category === activeFilter;

        const searchableText =
            `${d.title} ${d.description}`.toLowerCase();

        const matchesSearch =
            !q || searchableText.includes(q);

        return matchesCategory && matchesSearch;
    });

    /**
     * Generate deck cards.
     */
    $("#deckGrid").innerHTML = decks.length
        ? decks
              .map((d) => {
                  /*
                   * The original application stores mastery globally,
                   * not per card/deck. Therefore this percentage is
                   * still calculated from the global mastered count.
                   */
                  const masteredIn = Math.min(
                      d.cards.length,
                      Math.round(
                          d.cards.length *
                              (state.mastered /
                                  Math.max(1, totalCards()))
                      )
                  );

                  const pct = Math.round(
                      (masteredIn / d.cards.length) * 100
                  );

                  return `
                    <article class="deck-card-${d.category} deck-card">
                        <span class="badge ${d.category}">
                            ${esc(d.category)}
                        </span>

                        <div class="card-title-row">
                            <h2 title="${esc(d.title)}">
                                ${esc(d.title)}
                            </h2>

                            <button
                                class="menu-btn"
                                data-menu="${d.id}"
                            >
                                ⋮
                            </button>
                        </div>

                        <p>${esc(d.description)}</p>

                        <div class="divider"></div>

                        <div class="card-meta">
                            <span>
                                ▱ ${d.cards.length} Cards
                            </span>

                            <span>
                                ${pct}% Mastered
                            </span>
                        </div>

                        <div class="card-progress ${d.category}">
                            <span style="width: ${pct}%"></span>
                        </div>

                        <div class="card-buttons">
                            <button
                                class="study-btn ${d.category}"
                                data-study="${d.id}"
                            >
                                ▶ &nbsp;Study Now
                            </button>

                            <button
                                class="book-btn"
                                title="Deck details"
                                data-info="${d.id}"
                            >
                                ▣
                            </button>
                        </div>
                    </article>
                `;
              })
              .join("")
        : `
            <div class="empty">
                <h3>No decks found</h3>
                <p>
                    Try another search or create a new deck.
                </p>
            </div>
        `;

    /**
     * Connect buttons inside the newly rendered deck cards.
     */
    $$("[data-study]").forEach((button) => {
        button.onclick = () => {
            openStudy(+button.dataset.study);
        };
    });

    $$("[data-info]").forEach((button) => {
        button.onclick = () => {
            showInfo(+button.dataset.info);
        };
    });

    $$("[data-menu]").forEach((button) => {
        button.onclick = () => {
            deckMenu(+button.dataset.menu);
        };
    });
}


/* =========================================================
   8. MODAL
   ========================================================= */

/**
 * Open the shared modal with custom HTML content.
 */
function openModal(content, cls = "") {
    $("#modal").className = `modal ${cls}`;
    $("#modal").innerHTML = content;
    $("#modalBackdrop").classList.add("show");
}


/**
 * Close the shared modal.
 */
function closeModal() {
    $("#modalBackdrop").classList.remove("show");
}


/**
 * Close the modal when the user clicks the backdrop itself.
 */
$("#modalBackdrop").onclick = (e) => {
    if (e.target.id === "modalBackdrop") {
        closeModal();
    }
};


/* =========================================================
   9. CREATE DECK
   ========================================================= */

/**
 * Open the Create New Deck modal.
 */
function createDeck() {
    openModal(`
        <div class="modal-header">
            <h2>Create New Deck</h2>

            <button
                class="close"
                type="button"
                id="closeDeckModal"
            >
                ×
            </button>
        </div>

        <form id="deckForm">
            <div class="form-grid">

                <div class="field">
                    <label>DECK NAME</label>

                    <input
                        id="deckName"
                        required
                        placeholder="e.g. C++ DSA Basics"
                    >
                </div>

                <div class="field">
                    <label>CATEGORY</label>

                    <select id="deckCat">
                        <option>Programming</option>
                        <option>Languages</option>
                        <option>History</option>
                        <option>General</option>
                    </select>
                </div>

                <div class="field">
                    <label>DESCRIPTION</label>

                    <textarea
                        id="deckDesc"
                        required
                        placeholder="What will you learn?"
                    ></textarea>
                </div>

                <div class="field">
                    <label>QUESTIONS & ANSWERS</label>

                    <div id="questionsContainer">

                        <!-- First question -->
                        <div class="question-box">
                            <h3>Question 1</h3>

                            <input
                                type="text"
                                class="question-input"
                                placeholder="Enter a question"
                                required
                            >

                            <input
                                type="text"
                                class="answer-input"
                                placeholder="Enter the answer"
                                required
                            >
                        </div>

                    </div>

                    <button
                        type="button"
                        id="addQuestionBtn"
                    >
                        + Add Question
                    </button>
                </div>

            </div>

            <div class="modal-footer">
                <button
                    type="button"
                    class="cancel"
                    id="cancelDeckBtn"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="save"
                >
                    Create Deck
                </button>
            </div>
        </form>
    `);

    // Modal controls
    $("#closeDeckModal").onclick = closeModal;
    $("#cancelDeckBtn").onclick = closeModal;

    // Question counter
    let questionNumber = 1;


    /* -----------------------------------------------------
       Add Question
       ----------------------------------------------------- */

    $("#addQuestionBtn").onclick = function () {
        questionNumber++;

        const questionBox =
            document.createElement("div");

        questionBox.className = "question-box";

        questionBox.innerHTML = `
            <h3>Question ${questionNumber}</h3>

            <input
                type="text"
                class="question-input"
                placeholder="Enter a question"
                required
            >

            <input
                type="text"
                class="answer-input"
                placeholder="Enter the answer"
                required
            >

            <button
                type="button"
                class="remove-question"
            >
                Remove
            </button>
        `;

        $("#questionsContainer")
            .appendChild(questionBox);


        /* -------------------------------------------------
           Remove Question
           ------------------------------------------------- */

        questionBox.querySelector(
            ".remove-question"
        ).onclick = function () {
            questionBox.remove();
            updateQuestionNumbers();
        };
    };


    /* -----------------------------------------------------
       Update Question Numbers
       ----------------------------------------------------- */

    function updateQuestionNumbers() {
        const boxes =
            document.querySelectorAll(".question-box");

        boxes.forEach((box, index) => {
            box.querySelector("h3").textContent =
                `Question ${index + 1}`;
        });

        questionNumber = boxes.length;
    }


    /* -----------------------------------------------------
       Submit Deck Form
       ----------------------------------------------------- */

    $("#deckForm").onsubmit = function (e) {
        e.preventDefault();

        const questions = [];

        const questionBoxes =
            document.querySelectorAll(".question-box");


        /* Collect every question and answer */
        questionBoxes.forEach((box) => {
            const question =
                box
                    .querySelector(".question-input")
                    .value
                    .trim();

            const answer =
                box
                    .querySelector(".answer-input")
                    .value
                    .trim();

            questions.push({
                q: question,
                a: answer
            });
        });


        /* Create the new deck object */
        const newDeck = {
            id: Date.now(),

            title:
                $("#deckName")
                    .value
                    .trim(),

            category:
                $("#deckCat").value,

            description:
                $("#deckDesc")
                    .value
                    .trim(),

            cards:
                questions.map((q) => [q.q, q.a])
        };


        /* Add deck to application state */
        state.decks.push(newDeck);

        /*
         * IMPORTANT:
         * Save here so a newly created deck survives
         * page refreshes.
         */
        save();

        // Refresh the UI
        closeModal();
        renderAll();

        showToast(
            "Deck created successfully 🎉"
        );
    };
}


/* =========================================================
   10. EDIT DAILY GOAL
   ========================================================= */

/**
 * Open the Daily Goal editor.
 */
function editGoal() {
    openModal(`
        <div class="modal-header">
            <h2>Edit Daily Goal</h2>

            <button
                class="close"
                onclick="closeModal()"
            >
                ×
            </button>
        </div>

        <form id="goalForm">
            <div class="field">
                <label>CARDS PER DAY</label>

                <input
                    id="goalInput"
                    type="number"
                    min="1"
                    max="200"
                    value="${state.goal}"
                    required
                >
            </div>

            <div class="modal-footer">
                <button
                    type="button"
                    class="cancel"
                    onclick="closeModal()"
                >
                    Cancel
                </button>

                <button
                    class="save"
                >
                    Save Goal
                </button>
            </div>
        </form>
    `);

    $("#goalForm").onsubmit = (e) => {
        e.preventDefault();

        state.goal = +$("#goalInput").value;

        state.studied = Math.min(
            state.studied,
            state.goal
        );

        save();
        renderStats();

        closeModal();

        showToast(
            "Daily goal updated"
        );
    };
}


/* =========================================================
   11. STUDY MODE
   ========================================================= */

/**
 * Open a deck for studying.
 */
function openStudy(id) {
    activeDeck =
        state.decks.find((d) => d.id === id);

    cardIndex = 0;
    flipped = false;

    renderStudy();
}


/**
 * Render the currently active flashcard.
 */
function renderStudy() {
    const d = activeDeck;
    const c = d.cards[cardIndex];

    openModal(`
        <div class="modal-header">
            <div>
                <h2>${esc(d.title)}</h2>

                <div class="study-progress-text">
                    Card ${cardIndex + 1} of ${d.cards.length}
                </div>
            </div>

            <button
                class="close"
                onclick="closeModal()"
            >
                ×
            </button>
        </div>

        <div class="study-wrap">

            <div class="flashcard-scene">

                <div
                    class="flashcard"
                    id="flashcard"
                >
                    <div class="face">
                        <small>
                            QUESTION • Click to flip
                        </small>

                        <strong>
                            ${esc(c[0])}
                        </strong>
                    </div>

                    <div class="face back">
                        <small>ANSWER</small>

                        <strong>
                            ${esc(c[1])}
                        </strong>
                    </div>
                </div>

            </div>

            <div class="study-controls">

                <button
                    class="control"
                    id="prevBtn"
                >
                    ← Previous
                </button>

                <button
                    class="control"
                    id="flipBtn"
                >
                    ↻ Flip Card
                </button>

                <button
                    class="control gotit"
                    id="gotBtn"
                >
                    ✓ Got it
                </button>

            </div>
        </div>
    `);


    /* -----------------------------------------------------
       Flip Card
       ----------------------------------------------------- */

    $("#flashcard").onclick = () => {
        flipped = !flipped;

        $("#flashcard").classList.toggle(
            "flipped",
            flipped
        );
    };


    /* -----------------------------------------------------
       Flip Button
       ----------------------------------------------------- */

    $("#flipBtn").onclick = () => {
        $("#flashcard").click();
    };


    /* -----------------------------------------------------
       Previous Card
       ----------------------------------------------------- */

    $("#prevBtn").onclick = () => {
        cardIndex =
            (cardIndex - 1 + d.cards.length) %
            d.cards.length;

        flipped = false;

        renderStudy();
    };


    /* -----------------------------------------------------
       Got It Button
       ----------------------------------------------------- */

    $("#gotBtn").onclick = () => {
        markGotIt();

        if (cardIndex < d.cards.length - 1) {
            cardIndex++;
            flipped = false;

            renderStudy();
        } else {
            closeModal();

            showToast(
                "Deck complete! Great work 🔥"
            );
        }
    };
}


/* =========================================================
   12. MARK CARD AS COMPLETED
   ========================================================= */

/**
 * Update study/mastery statistics after clicking "Got it".
 */
function markGotIt() {
    state.mastered = Math.min(
        totalCards(),
        state.mastered + 1
    );

    state.studied = Math.min(
        state.goal,
        state.studied + 1
    );


    /*
     * Preserve the original streak logic.
     * Note: this is not a calendar-based streak system.
     */
    if (
        state.studied === 1 ||
        state.studied % 5 === 0
    ) {
        state.streak =
            Math.max(state.streak, 1);

        state.best =
            Math.max(
                state.best,
                state.streak
            );
    }

    save();

    renderStats();
    renderDecks();

    if (state.sound) {
        beep();
    }
}


/* =========================================================
   13. SOUND
   ========================================================= */

/**
 * Generate a short notification sound using
 * the Web Audio API.
 */
function beep() {
    try {
        const a = new AudioContext();
        const o = a.createOscillator();
        const g = a.createGain();

        o.frequency.value = 650;
        g.gain.value = 0.04;

        o.connect(g);
        g.connect(a.destination);

        o.start();

        o.stop(
            a.currentTime + 0.08
        );
    } catch (e) {
        // Ignore audio errors.
    }
}


/* =========================================================
   14. DECK INFORMATION
   ========================================================= */

/**
 * Show basic information about a deck.
 */
function showInfo(id) {
    const d =
        state.decks.find((x) => x.id === id);

    openModal(`
        <div class="modal-header">
            <h2>${esc(d.title)}</h2>

            <button
                class="close"
                onclick="closeModal()"
            >
                ×
            </button>
        </div>

        <p
            style="
                color: var(--muted);
                line-height: 1.6;
            "
        >
            ${esc(d.description)}
        </p>

        <div class="divider"></div>

        <p>
            <b>${d.cards.length}</b>
            flashcards in this deck.
        </p>

        <div class="modal-footer">
            <button
                class="save"
                onclick="
                    closeModal();
                    openStudy(${d.id});
                "
            >
                ▶ Start Studying
            </button>
        </div>
    `);
}


/* =========================================================
   15. DELETE DECK
   ========================================================= */

/**
 * Ask for confirmation and delete a deck.
 */
function deckMenu(id) {
    const d =
        state.decks.find((x) => x.id === id);

    if (
        confirm(
            `Delete "${d.title}"? This cannot be undone.`
        )
    ) {
        state.decks =
            state.decks.filter(
                (x) => x.id !== id
            );

        save();

        renderAll();

        showToast("Deck deleted");
    }
}


/* =========================================================
   16. IMPORT DECK FROM JSON
   ========================================================= */

/**
 * Read a JSON file and add valid decks to the application.
 */
function importDeck(file) {
    const reader = new FileReader();

    reader.onload = () => {
        try {
            const data =
                JSON.parse(reader.result);

            /*
             * Support both:
             *   { deck }
             * and:
             *   [ deck1, deck2, ... ]
             */
            const incoming =
                Array.isArray(data)
                    ? data
                    : [data];


            incoming.forEach((d) => {
                /*
                 * Only import objects that have:
                 * - a title
                 * - an array of cards
                 */
                if (
                    d.title &&
                    Array.isArray(d.cards)
                ) {
                    state.decks.push({
                        id:
                            Date.now() +
                            Math.random(),

                        category:
                            d.category ||
                            "Programming",

                        title:
                            d.title,

                        description:
                            d.description ||
                            "Imported flashcard deck.",

                        cards:
                            d.cards.map((c) =>
                                Array.isArray(c)
                                    ? c
                                    : [
                                        c.question,
                                        c.answer
                                    ]
                            )
                    });
                }
            });


            save();
            renderAll();

            showToast(
                "Deck imported successfully"
            );
        } catch {
            showToast(
                "Invalid JSON file"
            );
        }
    };

    reader.readAsText(file);
}


/* =========================================================
   17. RENDER EVERYTHING
   ========================================================= */

/**
 * Refresh all major UI sections.
 */
function renderAll() {
    renderStats();
    renderDecks();
}


/* =========================================================
   18. EVENT LISTENERS
   ========================================================= */

/* Create deck */
$("#createBtn").onclick = createDeck;


/* Edit daily goal */
$("#editGoal").onclick = editGoal;


/* Import JSON */
$("#importBtn").onclick = () => {
    $("#fileInput").click();
};


/* File selection */
$("#fileInput").onchange = (e) => {
    const file = e.target.files[0];

    if (file) {
        importDeck(file);
    }

    /*
     * Reset the input so the same file can be selected again.
     */
    e.target.value = "";
};


/* Search */
$("#searchInput").oninput = renderDecks;


/* Category filters */
$("#filters").onclick = (e) => {
    if (!e.target.matches(".filter")) {
        return;
    }

    activeFilter =
        e.target.dataset.filter;

    $$(".filter").forEach((x) => {
        x.classList.toggle(
            "active",
            x === e.target
        );
    });

    renderDecks();
};


/* =========================================================
   19. THEME TOGGLE
   ========================================================= */

$("#themeBtn").onclick = () => {
    state.dark = !state.dark;

    document.body.classList.toggle(
        "dark",
        state.dark
    );

    save();

    $("#themeBtn").textContent =
        state.dark ? "🌙" : "☀️";
};


/* =========================================================
   20. SOUND TOGGLE
   ========================================================= */

$("#soundBtn").onclick = () => {
    state.sound = !state.sound;

    save();

    $("#soundBtn").textContent =
        state.sound ? "🔊" : "🔇";

    showToast(
        state.sound
            ? "Sound on"
            : "Sound off"
    );
};


/* =========================================================
   21. RESTORE SAVED SETTINGS
   ========================================================= */

/*
 * Restore dark mode and sound icon after page load.
 */
document.body.classList.toggle(
    "dark",
    state.dark
);

$("#themeBtn").textContent =
    state.dark ? "🌙" : "☀️";

$("#soundBtn").textContent =
    state.sound ? "🔊" : "🔇";


/* =========================================================
   22. GOAL CARD
   ========================================================= */

/**
 * Clicking the goal card also opens the goal editor.
 */
$("#goalCard").onclick = editGoal;


/* =========================================================
   23. INITIAL RENDER
   ========================================================= */

/**
 * Render the application when the script loads.
 */
renderAll();
