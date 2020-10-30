function no() {
    // do nothing
}

// ====================
// Forms
// ====================

const login_form = document.querySelector('#login_form');

const session_input = document.querySelector('#session_input');
const player_input = document.querySelector('#player_input');
const role_input = document.querySelector('#role_input');
const table_size_input = document.querySelector('#table_size_input');

const login_button = document.querySelector('#login_button');
const host_controls = document.querySelector('#host_controls');
const reset_board = document.querySelector('#reset_board');

const game_status = document.querySelector('#game_status');

const table = document.querySelector('#table');
const scoreboard = document.querySelector('#scoreboard');
const timer = document.querySelector('#timer');
const loading = document.querySelector('#loading');
const progress = document.querySelector('#progress');

login_button.addEventListener('click', (e) => {
    e.preventDefault();

    // Check validity

    if (!(session_input.value == 'null' || player_input.value == 'null' || role_input.value == 'null')) {
        login_form.style.display = 'none';

        window.current_session = session_input.value;
        window.current_player = player_input.value;
        window.current_role = role_input.value;

        if (current_role === 'host') {
            host_controls.style.display = 'flex';
            reset_board.addEventListener('click', (e) => {
                e.preventDefault();
                table.innerText = '' // Deletes table
                host_init_game();
            })
        } else if (current_role === 'player') {
            game_status.style.display = 'block';
            player_init_game();
        }
    } else {
        alert('You must select all inputs!');
    }

});

// ====================
// Table and Cells
// ====================

// ===== Client Side =====

function host_init_game() {
    window.cell_qty = table_size_input.value; // Amount of cells to be displayed
    add_cells();
    resize_board();

    async function asyncCall() {
        loading.style.display = 'flex';
        index_cells();
        const result = await resolveAfter2Seconds();
        console.log(result);
        // expected output: "resolved"
    }

    function resolveAfter2Seconds() {
        return new Promise(resolve => {
            setTimeout(() => {
                add_players();
                setTimeout(() => {
                    load_bombs();
                    setTimeout(() => {
                        update_scoreboard();
                        setTimeout(() => {
                            send_ready_signal();
                            // host_controls.style.display = 'flex'; // Maybe not
                            setTimeout(() => {
                                add_event_listeners();
                                for (i = 0; i < cells.length; i++) {
                                    add_cell_snapshot(i);
                                }
                                reset_board.classList.add('red-btn');

                                table.style.display = 'flex';
                                scoreboard.style.display = 'flex';
                                loading.style.display = 'none';
                                // host_controls.style.display = 'flex'; // Maybe not
                            }, 1000);
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, 4000);
        });
    }

    asyncCall();
}

function add_cells() {
    for (i = 0; i < cell_qty; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        table.appendChild(cell);
    }
    window.cells = document.querySelectorAll('.cell');
}

function index_cells() {
    for (i = 0; i < cells.length; i++) {
        cells[i].dataset.index = i;
        push_indexes(cells[i]); // Send index to DB
    }
}

function resize_board() {
    const x = Math.sqrt(cell_qty).toFixed(0); // Rounded SquareRoot of cell quantity

    const style = document.createElement('style');
    style.innerHTML = `.cell { width: calc(100% / ${x}); }`;
    document.head.appendChild(style); // Append style to DOM
}

function fill_cell(cell) {
    if (!cell.dataset.fill) {
        cell.dataset.fill = current_player;
        push_selection(cell);
        update_scoreboard();
        if (cell.dataset.bomb) {
            alert('BOOM! You died... womp :(') // DON'T USE ALERT IN PRODUCTION
            cell.dataset.fill = 'black'; //local
            cell.innerText = '☠️ ' + current_player; //local
            block_player();
            push_death_innerText(cell.dataset.index);
        }
    }
}

function load_bombs() {
    for (i = 0; i < cells.length; i++) {

        const x = Math.random().toFixed(2);
        if (!cells[i].dataset.fill) { // If cell is not filled already
            if (x <= 0.15) { // 15% chance of bomb
                cells[i].dataset.bomb = true;
                push_bombs(i);
            }
        }

    }
}

function add_players() {
    const x = Math.sqrt(cell_qty).toFixed(0); // Rounded SquareRoot of cell quantity

    cells[0].dataset.fill = 'red';
    cells[x - 1].dataset.fill = 'green';
    cells[cells.length - x].dataset.fill = 'blue';
    cells[cells.length - 1].dataset.fill = 'yellow';

    push_players(0);
    push_players(x - 1);
    push_players(cells.length - x);
    push_players(cells.length - 1);
}

function add_event_listeners() {
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            fill_cell(cell);
        })
    });
}

// ===== Server Side =====

function push_indexes(cell) { // SET
    docRef = db.collection('sessions').doc(current_session).collection('cells').doc(cell.dataset.index);

    const data = { // Create data
        index: cell.dataset.index,
    };

    docRef.set(data).then(function () { // Push data to DB
        // do stuff after
        console.log('Reset cell');
    }).catch(function (error) {
        console.error(error);
    });
}

function push_players(index) { // UPDATE Method
    docRef = db.collection('sessions').doc(current_session).collection('cells').doc(`${index}`);

    const data = { // Create data
        fill: cells[index].dataset.fill,
    };

    docRef.update(data).then(function () { // Push data to DB
        // do stuff after
        console.log('Pushed player');
    }).catch(function (error) {
        console.error(error);
    });
}

function push_bombs(index) { // UPDATE Method
    docRef = db.collection('sessions').doc(current_session).collection('cells').doc(`${index}`);

    const data = { // Create data
        bomb: true,
    };

    docRef.update(data).then(function () { // Push data to DB
        // do stuff after
        console.log('Pushed bomb');
    }).catch(function (error) {
        console.error(error);
    });
}

function push_selection(cell) { // UPDATE Method
    docRef = db.collection('sessions').doc(current_session).collection('cells').doc(cell.dataset.index);

    const data = { // Create data
        fill: current_player,
    };

    docRef.update(data).then(function () { // Push data to DB
        // do stuff after
        console.log('Pushed cell update to DB');
    }).catch(function (error) {
        console.error(error);
    });
}

function push_death_innerText(index) { // UPDATE Method
    docRef = db.collection('sessions').doc(current_session).collection('cells').doc(index);

    const data = { // Create data
        innerText: '☠️ ' + current_player,
    };

    docRef.update(data).then(function () { // Push data to DB
        // do stuff after
        console.log('Pushed death innerText to DB');
    }).catch(function (error) {
        console.error(error);
    });
}

function send_ready_signal() {
    docRef = db.collection('sessions').doc(current_session).collection('ready').doc('ready');
    var autoID = db.collection('sessions').doc().id;
    const data = { // Create data
        status: autoID,
        cells: cells.length,
    };

    docRef.update(data).then(function () { // Push data to DB
        // do stuff after
        console.log('Session is ready!');
    }).catch(function (error) {
        console.error(error);
    });
}

// ====================
// Scoreboard
// ====================

const red_score = document.querySelector('#red_score');
const green_score = document.querySelector('#green_score');
const blue_score = document.querySelector('#blue_score');
const yellow_score = document.querySelector('#yellow_score');

function update_scoreboard() {
    red_count = document.querySelectorAll('.cell[data-fill="red"]').length;
    green_count = document.querySelectorAll('.cell[data-fill="green"]').length;
    blue_count = document.querySelectorAll('.cell[data-fill="blue"]').length;
    yellow_count = document.querySelectorAll('.cell[data-fill="yellow"]').length;

    red_score.innerText = red_count;
    green_score.innerText = green_count;
    blue_score.innerText = blue_count;
    yellow_score.innerText = yellow_count;

    window.scores = [
        red = {
            name: 'Red',
            count: red_count,
        },
        green = {
            name: 'Green',
            count: green_count,
        },
        blue = {
            name: 'Blue',
            count: blue_count,
        },
        yellow = {
            name: 'Yellow',
            count: yellow_count,
        },
    ];

    // console.log(scores);

    push_scores();
    check_for_win(scores);
}

// update_scoreboard() // An Init

const modal = document.querySelector('#modal');
const win_modal = document.querySelector('#modal_win');
const winner_status = document.querySelector('#winner_status');

function check_for_win(scores) {
    const filled_cells = document.querySelectorAll('.cell[data-fill]');
    window.cells = document.querySelectorAll('.cell');
    if (filled_cells.length === cells.length) {
        const winner = Math.max.apply(Math, scores.map(function (o) { return o.count; }));
        console.log('Win: ' + winner);
        // Display winner name
        modal.style.display = 'flex';
        win_modal.style.display = 'flex';
        winner_status.innerText = winner;
    }
}

function block_player() {
    player_input.dataset.dead == true;
}

// ===== Server Side =====

function push_scores() {
    for (i = 0; i < scores.length; i++) {
        const player = scores[i].name;
        docRef = db.collection('sessions').doc(current_session).collection('scores').doc(player);

        const data = { // Create data
            count: scores[i].count,
        };

        docRef.update(data).then(function () { // Push data to DB
            // do stuff after
            console.log('Pushed score');
        }).catch(function (error) {
            console.error(error);
        });

    }
}

// ====================
// PLAYER Setup
// ====================

function player_init_game() {
    var r_x = 0;
    db.collection("sessions").doc(current_session).collection('ready').doc('ready')
        .onSnapshot(function (doc) {
            r_x++;
            if (r_x > 1) { // After 2nd snapshot
                console.log('I hear a reset!');
                game_status.style.display = 'none';
                table.innerText = '' // Deletes table
                pull_board();
                // pull_scores();
                // grab new timer?
            }
        });
}

function pull_board() {
    console.log('Downloading board...');
    pull_cell_count();
}

function pull_cell_count() {
    const docRef = db.collection("sessions").doc(current_session).collection('ready').doc('ready');

    docRef.get().then(function (doc) {
        if (doc.exists) {
            const cell_count = doc.data().cells;
            for (i = 0; i < cell_count; i++) {
                build_local_board(i);
                if (i === cell_count - 1) { // When completed...
                    window.cell_qty = cell_count; // Amount of cells to be displayed
                    resize_board();
                    loading.style.display = 'flex';
                }
            }
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch(function (error) {
        console.log("Error getting document:", error);
    });
}

function build_local_board(i) {
    const docRef = db.collection("sessions").doc(current_session).collection('cells').doc(`${i}`);

    docRef.get().then(function (doc) {
        if (doc.exists) {
            const result = doc.data();

            const fill = result.fill;
            const bomb = result.bomb;
            const index = result.index;
            const innerText = result.innerText;

            local_build_cell(i, index, bomb, fill, innerText);

        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch(function (error) {
        console.log("Error getting document:", error);
    });
}

function local_build_cell(i, index, bomb, fill, innerText) {
    const cell = document.createElement('div');
    cell.classList.add('cell');

    index === undefined ? no() : cell.dataset.index = index;
    bomb === undefined ? no() : cell.dataset.bomb = bomb;
    fill === undefined ? no() : cell.dataset.fill = fill;
    innerText === undefined ? no() : cell.innerText = innerText;

    table.appendChild(cell);
    cell.addEventListener('click', () => {
        fill_cell(cell);
    })
    scoreboard.style.display = 'flex';
    table.style.display = 'flex';
    loading.style.display = 'none';
    add_cell_snapshot(i)
}

// ====================
// INTRA-GAME SNAPSHOTS
// ====================

function add_cell_snapshot(i) {
    var r_x = 0;
    db.collection("sessions").doc(current_session).collection('cells').doc(`${i}`)
        .onSnapshot(function (doc) {
            //do stuff
            r_x++;
            if (r_x > 1) { // After 2nd snapshot
                const docRef = db.collection("sessions").doc(current_session).collection('cells').doc(`${i}`);

                docRef.get().then(function (doc) {
                    window.cells = document.querySelectorAll('.cell');
                    const result = doc.data();

                    const fill = result.fill;
                    const innerText = result.innerText;

                    fill === undefined ? no() : cells[i].dataset.fill = fill;
                    innerText === undefined ? no() : cells[i].innerText = innerText;

                    update_scoreboard();

                }).catch(function (error) {
                    console.log("Error getting document:", error);
                });
            }

        });
}

// TASKS

// 1. Push and pull innerText
// 2. Decipher winner name

// 3. Push and pull deaths???