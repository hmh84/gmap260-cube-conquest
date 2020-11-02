// ====================
// INTRODUCTION
// ====================

const modal_intro = document.querySelector('#modal_intro');
const hide_intro = document.querySelector('#hide_intro');
const intro_button = document.querySelector('#intro_button');

intro_button.addEventListener('click', (e) => {
    e.preventDefault();
    toggle_modal('modal_intro');
});

hide_intro.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.setItem('intro', 'false');
    console.log('intro set to: ' + sessionStorage.getItem('intro'));
    toggle_modal('close');
});

if (sessionStorage.getItem('intro') === 'true') {
    console.log('Init intro = ' + sessionStorage.getItem('intro'));
    toggle_modal('modal_intro');
}

// ====================
// GENERAL FUNCTIONS
// ====================

function no() {
    // do nothing
}

function timestamp() { // Returns the current timestamp, Usage: "console.log(timestamp());"
    return firebase.firestore.Timestamp.fromDate(new Date());
}

function format_tstamp(tstamp) { // Formats moment.js timestamp into cleaner format
    return moment(tstamp.toDate()).format("hhmmss");
}

const modal = document.querySelector('#modal');
const all_modals = document.querySelectorAll('.modal_common');

function toggle_modal(new_modal) {
    modal.classList.add('modal_open');
    all_modals.forEach(modal => {
        modal.style.display = 'none';
    });
    if (new_modal == 'close') {
        modal.classList.remove('modal_open');
    } else {
        document.querySelector(`#${new_modal}`).style.display = 'flex';
    }
};

const disarm = document.querySelector('#disarm');
const close_modal = document.querySelectorAll('.close_modal');

disarm.addEventListener('click', (e) => {
    e.preventDefault();
    toggle_modal('close');
});

function arm_bomb(cell) {
    var old_e = document.querySelector('#kill');
    var new_e = old_e.cloneNode(true);
    old_e.parentNode.replaceChild(new_e, old_e);

    const kill = document.querySelector('#kill');
    kill.addEventListener('click', (e) => {
        e.preventDefault();


        kill_player(cell);
        toggle_modal('modal_dead');
    });
}

function kill_player(cell) {
    window.dead = true;
    play_tone('explode');
    cell.dataset.fill = 'black';
    cell.innerText = '☠️ ' + current_player;
    push_death_innerText(cell.dataset.index);
    push_death(current_player);
}

close_modal.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggle_modal('close');
    })
});

// ====================
// FORMS
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
        document.querySelector(`#${current_player}_score`).classList.add('current_player');
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
// HOST SETUP
// ====================

// ===== Initialize Board =====

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
                            reset_scores();
                            setTimeout(() => {
                                send_ready_signal();
                                setTimeout(() => {
                                    add_event_listeners();
                                    for (i = 0; i < cells.length; i++) {
                                        add_cell_snapshot(i);
                                    }
                                    reset_board.classList.add('red-btn');

                                    table.style.display = 'flex';
                                    scoreboard.style.display = 'flex';
                                    loading.style.display = 'none';
                                    window.dead = false;
                                    add_score_snapshot_listeners();
                                    // host_controls.style.display = 'flex'; // Maybe not
                                }, 1000);

                            }, 1000);
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, 4000);
        });
    }

    asyncCall();
}

// ===== Client Side Setup =====

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
        cells[i].innerText = i;
        push_indexes(cells[i]); // Send index to DB
    }
}

function resize_board() {
    const x = Math.sqrt(cell_qty).toFixed(0); // Rounded SquareRoot of cell quantity

    const style = document.createElement('style');
    style.innerHTML = `.cell { width: calc(100% / ${x}); height: calc(80vh / ${x}); }`;
    document.head.appendChild(style); // Append style to DOM
}

const wait_to_move = document.querySelector('#wait_to_move');

window.block_player = false; // Init

function fill_cell(cell) {
    // if (!cell.dataset.fill && !dead && !block_player && !time_block && check_adjacent(cell)) {
    if (!cell.dataset.fill && !dead && !block_player && !time_block) {
        window.block_player = true;

        wait_to_move.style.opacity = '1';
        wait_to_move.innerText = '2s';
        setTimeout(function () {
            wait_to_move.innerText = '1s';
        }, 1000);
        setTimeout(function () {
            wait_to_move.style.opacity = '0';
            window.block_player = false;
        }, 2000);

        cell.dataset.fill = current_player;
        push_selection(cell);
        update_scoreboard();
        if (cell.dataset.bomb) {
            toggle_modal('modal_bomb');
            play_tone('uh-oh');
            arm_bomb(cell);
            play_tone('uh-oh');
        } else {
            play_tone('p1_select');
        }
    }
}

function check_adjacent(cell) {
    const cells = document.querySelectorAll('.cell');
    const x = parseInt(Math.sqrt(cells.length).toFixed(0));
    const cur_index = parseInt(cell.dataset.index);

    const adj_cells = [
        top = {
            obj: cells[cur_index - x],
        },
        right = {
            obj: cells[cur_index + 1],
        },
        bottom = {
            obj: cells[cur_index + x],
        },
        left = {
            obj: cells[cur_index - 1],
        },
    ];

    adj_cells.forEach(c => { // If in bounds & is current players color
        if ((c.obj) && (c.obj.dataset.fill === current_player)) {
            console.log('true');
            return true;
        }
    });
}

function load_bombs() {
    for (i = 0; i < cells.length; i++) {

        const x = Math.random().toFixed(2);
        if (!cells[i].dataset.fill) { // If cell is not filled already
            if (x <= 0.2) { // 20% chance of bomb
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

function sync_game(sync_time, game_timer) {
    const host_sync = parseInt(format_tstamp(sync_time));
    const start_time = host_sync + 5; // 5 Second delay
    const end_time = start_time + seconds_convert(game_timer);

    (function () {
        // Sync Game
        var check_time = function () {
            const current = parseInt(format_tstamp(timestamp()));
            const time_diff = start_time - current;
            timer.style.opacity = '1';
            timer.innerText = 'Match Starts in ' + time_diff + 's';


            if (current >= start_time) { // Start time
                clearInterval(s); // End Sync Checks
                update_scoreboard();
                timer.innerText = 'Go!';
                play_tone('start');
                window.time_block = false;
                window.c_rep = setInterval(countdown, 1000) // Start Countdown
            } else {
                window.time_block = true;
            }
        };

        var s = setInterval(check_time, 100); // Start it right away, check every 1/10s

        var tone_checks = function () {
            const current = parseInt(format_tstamp(timestamp()));
            const time_diff = start_time - current;

            if (time_diff === 3 || time_diff === 2 || time_diff === 1) {
                play_tone('countdown');
            }
            console.log('Time Diff = ' + time_diff);
            current >= start_time && clearInterval(t_rep); // End Tone Checks
        }

        var t_rep = setInterval(tone_checks, 1000); // Start it right away, check every 1s

        // Set Countdown
        let countdown_time = game_timer;
        var countdown = function () {
            const current = parseInt(format_tstamp(timestamp()));
            // const time_diff = end_time - current;

            countdown_time = countdown_time - 1;

            timer.innerText = 'Time Remaining: ' + countdown_time + 's';

            if (countdown_time === 3 || countdown_time === 2 || countdown_time === 1) {
                play_tone('countdown');
            }

            if (current >= end_time) { // Start time
                clearInterval(c_rep);
                timer.innerText = 'Time!';
                window.time_block = true;
                declare_win();
            } else {
                window.time_block = false;
            }
        };
    })();
}

function seconds_convert(total_seconds) {
    var m = Math.floor(total_seconds / 60);
    var s = total_seconds - m * 60;
    var seconds = ("0" + s).slice(-2);

    return parseInt("" + m + seconds);
}

// ===== Server Side Setup =====

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

function push_death(current_player) {
    docRef = db.collection('sessions').doc(current_session).collection('scores').doc(`${current_player}`);

    const data = { // Create data
        dead: true,
    };

    docRef.update(data).then(function () { // Push data to DB
        // do stuff after
        console.log('Pushed death');
    }).catch(function (error) {
        console.error(error);
    });
}

function send_ready_signal() { // SET Method
    docRef = db.collection('sessions').doc(current_session).collection('ready').doc('ready');
    var autoID = db.collection('sessions').doc().id;
    const data = { // Create data
        status: autoID,
        cells: cells.length,
        sync_time: timestamp(),
        game_timer: timer_input.value
    };

    sync_game(timestamp(), timer_input.value) // Host game sync

    docRef.set(data).then(function () { // Push data to DB
        // do stuff after
        console.log('Session is ready!');
    }).catch(function (error) {
        console.error(error);
    });
}

// ====================
// SCOREBOARD
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

const modal_win = document.querySelector('#modal_win');
const winner_status = document.querySelector('#winner_status');
const modal_bomb = document.querySelector('#modal_bomb');

function check_for_win(scores) {
    const filled_cells = document.querySelectorAll('.cell[data-fill]');
    window.cells = document.querySelectorAll('.cell');
    if (filled_cells.length === cells.length) {
        declare_win();
    }
}

function declare_win() {
    const winner = Math.max.apply(Math, scores.map(function (o) { return o.count; }));
    console.log('Win: ' + winner);
    play_tone('win');
    // Display winner name
    toggle_modal('modal_win');
    winner_status.innerText = winner;
}

// ===== Server Side Scoreboard =====

function reset_scores() {
    for (i = 0; i < scores.length; i++) {
        const player = scores[i].name.toLowerCase();
        docRef = db.collection('sessions').doc(current_session).collection('scores').doc(player);

        const data = { // Create data
            count: scores[i].count,
            dead: false,
        };

        docRef.set(data).then(function () { // Push data to DB
            // do stuff after
            console.log('Pushed score');
        }).catch(function (error) {
            console.error(error);
        });

    }
}

function push_scores() {
    for (i = 0; i < 4; i++) {
        const player = scores[i].name.toLowerCase();
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
// LOCAL/PLAYER SETUP
// ====================

window.time_block = true; // Init

// ===== Download/Initialize Board =====

function player_init_game() {
    var r_x = 0;
    const docRef = db.collection("sessions").doc(current_session).collection('ready').doc('ready');

    const snapshot_ready = docRef.onSnapshot(function (doc) {
        r_x++;
        if (r_x > 1) { // After 2nd snapshot
            unsubscribe_all();
            toggle_modal('close');
            console.log('I hear a reset!');
            game_status.style.display = 'none';
            table.innerText = '' // Deletes table
            pull_board();
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
            const result = doc.data();

            const cell_count = result.cells;
            const sync_time = result.sync_time;
            const game_timer = result.game_timer;

            sync_game(sync_time, game_timer);

            for (i = 0; i < cell_count; i++) {
                build_local_board(i);
                if (i === cell_count - 1) { // When completed...
                    window.cell_qty = cell_count; // Amount of cells to be displayed
                    resize_board();
                    loading.style.display = 'flex';
                    add_score_snapshot_listeners();
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
    add_cell_snapshot(i);
    window.dead = false;
}

// ===== Intra-Game Snapshot Listeners =====

function add_cell_snapshot(i) {
    const docRef = db.collection("sessions").doc(current_session).collection('cells').doc(`${i}`);
    var r_x = 0;
    const snapshot_cells = docRef.onSnapshot(function (doc) {
        //do stuff
        r_x++;

        if (r_x > 1) { // After 2nd snapshot
            const docRef = db.collection("sessions").doc(current_session).collection('cells').doc(`${i}`);

            docRef.get().then(function (doc) {
                window.cells = document.querySelectorAll('.cell');
                const result = doc.data();

                const fill = result.fill;
                const innerText = result.innerText;

                function place_selection(fill) {
                    cells[i].dataset.fill = fill;
                    console.log('the fill is ' + fill);
                    if (!fill === current_player) {
                        console.log("P2's fill is " + fill);
                        play_tone('explode');
                    }
                }
                fill === undefined ? no() : place_selection(fill);

                innerText === undefined ? no() : cells[i].innerText = innerText;

                update_scoreboard();

            }).catch(function (error) {
                console.log("Error getting document:", error);
            });
        }

    });
}

function add_score_snapshot_listeners() {
    for (i = 0; i < scores.length; i++) {
        const player = scores[i].name.toLowerCase();
        window.death_count = 0; // Reset

        const docRef = db.collection("sessions").doc(current_session).collection('scores').doc(player);

        const snapshot_scores = docRef.onSnapshot(function (doc) {
            docRef.get().then(function (doc) {
                if (doc.exists) {
                    const result = doc.data();

                    const dead = result.dead;
                    dead && window.death_count++;

                    console.log(death_count);
                } else {
                    // doc.data() will be undefined in this case
                    console.log("No such document!");
                }
            }).catch(function (error) {
                console.log("Error getting document:", error);
            });

        });
    }
}

function unsubscribe_all() {
    typeof snapshot_cells != "undefined" && snapshot_cells();
    typeof snapshot_scores != "undefined" && snapshot_scores();
}

// Sounds


function play_tone(target) {
    const new_audio = new Audio(`assets/sounds/${target}.mp3`);
    new_audio.play();
}

// TASKS

// 1. Spend points after bomb defusal
// 2. If all players are dead the game ends
// 3. Decipher winner name instead of score
// 4. Only allow movement in NSEW directions
// 5. SFX
// 6. Add actual mini-game to death modal
// 7. Change score after death
// 8. Fix host controls not fitting on iPad