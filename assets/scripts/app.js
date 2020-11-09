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
    toggle_modal('close');
});

const all_buttons = document.querySelectorAll('button');

all_buttons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        play_tone('btn_press');
    })
});

function play_tone(target) {
    if (target === 'bgm') {
        const bgm = document.querySelector('#bgm');
        if (bgm.paused) {
            bgm.play();
        } else {
            bgm.currentTime = 0
        }
    } else {
        const new_audio = new Audio(`assets/sounds/${target}.mp3`);
        new_audio.play();
    }
}

// ====================
// GENERAL FUNCTIONS
// ====================

function no() {
    // do nothing
}

const snapshots = [];

function timestamp() { // Returns the current timestamp, Usage: 'console.log(timestamp());'
    return firebase.firestore.Timestamp.fromDate(new Date());
}

function format_tstamp(tstamp) { // Formats moment.js timestamp into cleaner format
    return moment(tstamp.toDate()).format('hhmmss');
}

function ms_format_tstamp(tstamp) { // Formats moment.js timestamp into cleaner format
    return moment(tstamp.toDate()).format('hhmmssS');
}

function seconds_convert(total_seconds) {
    var m = Math.floor(total_seconds / 60);
    var s = total_seconds - m * 60;
    var seconds = ('0' + s).slice(-2);

    return parseInt('' + m + seconds);
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

const close_modal = document.querySelectorAll('.close_modal');


function arm_bomb(cell) {
    // do stuff

    // Re-init disarm
    var old_e = document.querySelector('#disarm');
    var new_e = old_e.cloneNode(true);
    old_e.parentNode.replaceChild(new_e, old_e);

    const disarm = document.querySelector('#disarm');
    disarm.addEventListener('click', (e) => {
        e.preventDefault();
        cell.dataset.bomb = false;
        push_diffuse(cell);
        toggle_modal('close');
    });
}

function kill_player(cell) {
    window.dead = true;
    play_tone('explode');
    cell.dataset.fill = 'black';
    cell.innerText = '☠️ ' + current_player;
    push_death_plot(cell.dataset.index);
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
const game_status_2 = document.querySelector('#game_status_2');
const host_controls_title = document.querySelector('#host_controls_title');

const table = document.querySelector('#table');
const scoreboard = document.querySelector('#scoreboard');
const timer = document.querySelector('#timer');
const loading = document.querySelector('#loading');
const progress = document.querySelector('#progress');

const title = document.querySelector('title');
const game_intro = document.querySelector('#game_intro');

login_button.addEventListener('click', (e) => {
    e.preventDefault();

    // Check validity

    if (!(session_input.value == 'null' || player_input.value == 'null' || role_input.value == 'null')) {
        title.innerText += ` - Room ${session_input.value}`;
        login_form.style.display = 'none';

        window.current_session = session_input.value;
        window.current_player = player_input.value;
        document.querySelector(`#${current_player}_score`).classList.add('current_player');
        window.current_role = role_input.value;

        if (current_role === 'host') {
            host_controls_title.innerText += ` for Room #${session_input.value}`;
            host_controls.style.display = 'flex';
            game_intro.style.display = 'none';
            reset_board.addEventListener('click', (e) => {
                e.preventDefault();
                unsubscribe_all();
                console.log(game_intro);
                reset_board.disabled = true;
                table.innerText = ''; // Deletes table
                host_init_game();
            })
        } else if (current_role === 'player') {
            game_status.style.display = 'block';
            game_status.innerText = `Waiting for host to start game for Room #${session_input.value}...`;
            game_status_2.innerText = `You are ${current_player.toUpperCase()}`;
            game_status_2.style.color = current_player;
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
        // expected output: 'resolved'
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
                                    reset_board.disabled = false;
                                    // add_death_snapshot_listener();
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
        cells[i].dataset.bomb = false;
        // cells[i].innerText = i;
        push_indexes(cells[i]); // Send index to DB
    }
}

function resize_board() {
    const x = Math.sqrt(cell_qty).toFixed(0); // Rounded SquareRoot of cell quantity

    const style = document.createElement('style');
    style.innerHTML = `
        .cell {
            width: calc(100% / ${x});
            height: calc(100% / ${x});
        }
        .cell[data-fill="${current_player}"]:hover {
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style); // Append style to DOM
}

const wait_to_move = document.querySelector('#wait_to_move');

window.plot_claim_delay = false; // Init

function fill_cell(cell) {
    if (!dead && !plot_claim_delay && !time_block && (check_adjacent(cell) == true)) { // If not dead, no plot claim delay, and game timer has not run out

        console.log('b4 fill = ' + cell.dataset.fill);
        console.log('TEST' + cell.dataset.fill === current_player);
        if (cell.dataset.fill && !cell.dataset.fill === current_player) { // If selected cell is in enemy territory (filled but not yours)
            add_plot_claim_delay('5'); // Slow them down more than usual
            console.log('enemy territory...');
        } else {
            console.log('bomb status = ' + cell.dataset.bomb);
            if (cell.dataset.bomb === 'true') { // If you find a bomb
                console.log('found a bomb...');
                add_plot_claim_delay('5');
                toggle_modal('modal_bomb');
                play_tone('uh_oh');
                arm_bomb(cell);
            } else { // Standard unfilled cell
                console.log('no bomb, standard fill...');
                add_plot_claim_delay('2');
                play_tone('p1_select');
            }
        }
        console.log('filling...');
        cell.dataset.fill = current_player;
        push_selection(cell);
    }
}

function add_plot_claim_delay(s) { // 1 parm (s) is # of seconds to delay the player
    window.plot_claim_delay = true;
    wait_to_move.style.opacity = '1';

    // console.log('delay = ' + x);
    wait_to_move.innerText = `${s}s`;
    const check_time = function() {
        s--
        wait_to_move.innerText = `${s}s`;
        if (s <= 0) { // End
            clearInterval(b_check); // End Checks
            window.plot_claim_delay = false;
            wait_to_move.style.opacity = '0';
        }
    };
    const b_check = setInterval(check_time, 1000); // Run every 1s
}

function check_adjacent(cell) {
    let current_index = parseInt(cell.dataset.index);
    const count_x = parseInt(Math.sqrt(cells.length).toFixed(0));
    let adj_cells = [cells[current_index + 1], cells[current_index - 1], cells[current_index + (count_x)], cells[current_index - count_x]];
    let count = 0;
    adj_cells.forEach(i => {
        if (typeof(i) != 'undefined') {
            if (i.dataset.fill == current_player) {
                count += 1;
            }
        }
    });
    if (count > 0) {
        return true;
    } else {
        return false;
    }
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
    console.log('Syncing game...');

    const n_host_sync = parseInt(format_tstamp(sync_time));
    const n_start_time = n_host_sync + 5; // 5 Second delay for loading
    const n_end_time = n_start_time + seconds_convert(game_timer);

    const host_sync = parseInt(ms_format_tstamp(sync_time));
    const start_time = host_sync + 50; // 5 Second delay for loading

    (function() {
        // Sync Game
        const check_time = function() {
            const current = parseInt(ms_format_tstamp(timestamp()));
            const time_diff = start_time - current;
            display_timer = Math.round(time_diff / 10);

            timer.style.opacity = '1';
            timer.innerText = 'Match Starts in ' + display_timer + 's';

            if (time_diff === 30 || time_diff === 20 || time_diff === 10) {
                play_tone('countdown');
            }

            if (current >= start_time) { // Start time
                clearInterval(s_check); // End Sync Checks
                update_scoreboard();
                timer.innerText = 'Go!';
                play_tone('start');
                play_tone('bgm');
                window.time_block = false;
                window.c_check = setInterval(countdown, 1000) // Start Countdown
            } else {
                window.time_block = true;
            }
        };

        window.s_check = setInterval(check_time, 100); // Start it right away, check every 1/10s

        // Set Countdown
        let countdown_time = game_timer;
        const countdown = function() {
            const current = parseInt(format_tstamp(timestamp()));
            countdown_time--;

            timer.innerText = 'Time Remaining: ' + countdown_time + 's';

            if (countdown_time === 3 || countdown_time === 2 || countdown_time === 1) {
                play_tone('countdown');
            }

            if (current >= n_end_time) { // Start time
                clearInterval(c_check);
                timer.innerText = 'Time!';
                window.time_block = true;
                declare_win();
            } else {
                window.time_block = false;
            }
        };
    })();
}

// ===== Server Side Setup =====

function push_indexes(cell) { // SET
    docRef = db.collection('sessions').doc(current_session).collection('cells').doc(cell.dataset.index);

    const data = { // Create data
        index: cell.dataset.index,
        bomb: cell.dataset.bomb,
    };

    docRef.set(data).then(function() { // Push data to DB
        // do stuff after
        console.log('Reset cell');
    }).catch(function(error) {
        console.error(error);
    });
}

function push_players(index) { // UPDATE Method
    docRef = db.collection('sessions').doc(current_session).collection('cells').doc(`${index}`);

    const data = { // Create data
        fill: cells[index].dataset.fill,
    };

    docRef.update(data).then(function() { // Push data to DB
        // do stuff after
        console.log('Pushed player');
    }).catch(function(error) {
        console.error(error);
    });
}

function push_bombs(index) { // UPDATE Method
    docRef = db.collection('sessions').doc(current_session).collection('cells').doc(`${index}`);

    const data = { // Create data
        bomb: true,
    };

    docRef.update(data).then(function() { // Push data to DB
        // do stuff after
        console.log('Pushed bomb');
    }).catch(function(error) {
        console.error(error);
    });
}

function push_selection(cell) { // UPDATE Method
    docRef = db.collection('sessions').doc(current_session).collection('cells').doc(cell.dataset.index);

    const data = { // Create data
        fill: current_player,
    };

    docRef.update(data).then(function() { // Push data to DB
        // do stuff after
        console.log('Pushed cell update to DB');
    }).catch(function(error) {
        console.error(error);
    });
}

function push_diffuse(cell) { // UPDATE Method
    docRef = db.collection('sessions').doc(current_session).collection('cells').doc(cell.dataset.index);

    const data = { // Create data
        bomb: cell.dataset.bomb,
    };

    docRef.update(data).then(function() { // Push data to DB
        // do stuff after
        console.log('Pushed bomb diffuse to DB');
    }).catch(function(error) {
        console.error(error);
    });
}

function push_death_plot(index) { // UPDATE Method
    docRef = db.collection('sessions').doc(current_session).collection('cells').doc(index);

    const data = { // Create data
        innerText: '☠️ ' + current_player,
        fill: 'black',
    };

    docRef.update(data).then(function() { // Push data to DB
        // do stuff after
        console.log('Pushed death innerText to DB');
    }).catch(function(error) {
        console.error(error);
    });
}

function push_death(current_player) {
    docRef = db.collection('sessions').doc(current_session).collection('scores').doc(`${current_player}`);

    const data = { // Create data
        dead: true,
    };

    docRef.update(data).then(function() { // Push data to DB
        // do stuff after
        console.log('Pushed death');
    }).catch(function(error) {
        console.error(error);
    });
}

function send_ready_signal() { // SET Method
    docRef = db.collection('sessions').doc(current_session).collection('ready').doc('ready');
    var autoID = db.collection('sessions').doc().id;
    const sync_tstamp = timestamp();
    const data = { // Create data
        status: autoID,
        cells: cells.length,
        sync_time: sync_tstamp,
        game_timer: timer_input.value
    };

    sync_game(sync_tstamp, timer_input.value) // Host game sync

    docRef.set(data).then(function() { // Push data to DB
        // do stuff after
        console.log('Session is ready!');
    }).catch(function(error) {
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
            display_name: 'Player 1'
        },
        green = {
            name: 'Green',
            count: green_count,
            display_name: 'Player 2'
        },
        blue = {
            name: 'Blue',
            count: blue_count,
            display_name: 'Player 3'
        },
        yellow = {
            name: 'Yellow',
            count: yellow_count,
            display_name: 'Player 4'
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
    const max = Math.max.apply(Math, scores.map(function(o) { return o.count; }));
    const winner = scores.filter(function(o) { return (o.count == max); });

    winner_status.innerText = winner[0].display_name;
    toggle_modal('modal_win');
    win_effect(winner[0].name.toLowerCase());

    // End Countdown
    clearInterval(c_check); // Countdown Check
    timer.innerText = 'Game Ended!';
    window.time_block = true;
}

function flash_v1(color) {
    if (color === 'yellow') {
        winner_status.style.color = color;
        modal_win.style.backgroundColor = 'black';
    } else {
        winner_status.style.color = color;
        modal_win.style.backgroundColor = 'white';
    }
}

function flash_v2(color) {
    if (color === 'yellow') {
        modal_win.style.backgroundColor = color;
        winner_status.style.color = 'black';
    } else {
        modal_win.style.backgroundColor = color;
        winner_status.style.color = 'white';
    }
}

function win_effect(color) {
    play_tone('win');
    const flash_speed = 175; // in ms
    flash_v1(color);
    setTimeout(function() {
        flash_v2(color);
        setTimeout(function() {
            flash_v1(color);
            setTimeout(function() {
                flash_v2(color);
                setTimeout(function() {
                    flash_v1(color);
                    setTimeout(function() {
                        flash_v2(color);
                        setTimeout(function() {
                            flash_v1(color);
                            setTimeout(function() {
                                flash_v2(color);
                            }, flash_speed);
                        }, flash_speed);
                    }, flash_speed);
                }, flash_speed);
            }, flash_speed);
        }, flash_speed);
    }, flash_speed);
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

        docRef.set(data).then(function() { // Push data to DB
            // do stuff after
            console.log('Reset score');
        }).catch(function(error) {
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

        docRef.update(data).then(function() { // Push data to DB
            // do stuff after
            console.log('Pushed score');
        }).catch(function(error) {
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
    const docRef = db.collection('sessions').doc(current_session).collection('ready').doc('ready');

    const snapshot_ready = docRef.onSnapshot(function(doc) {
        r_x++;
        if (r_x > 1) { // After 2nd snapshot
            unsubscribe_all();
            toggle_modal('close');
            console.log('I hear a reset!');
            game_intro.style.display = 'none';
            game_status.style.display = 'none';
            pull_new_board();
        }
    });
}

function pull_new_board() {
    table.innerText = '' // Deletes table
    console.log('Downloading board...');
    pull_cell_count();
}

function pull_cell_count() {
    const docRef = db.collection('sessions').doc(current_session).collection('ready').doc('ready');

    docRef.get().then(function(doc) {
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
                    // add_death_snapshot_listener();
                }
            }
        } else {
            // doc.data() will be undefined in this case
            console.log('No such document!');
        }
    }).catch(function(error) {
        console.log('Error getting document:', error);
    });
}

function build_local_board(i) {
    const docRef = db.collection('sessions').doc(current_session).collection('cells').doc(`${i}`);

    docRef.get().then(function(doc) {
        if (doc.exists) {
            const result = doc.data();

            const fill = result.fill;
            const bomb = result.bomb;
            const index = result.index;
            const innerText = result.innerText;

            local_build_cell(i, index, bomb, fill, innerText);

        } else {
            // doc.data() will be undefined in this case
            console.log('No such document!');
        }
    }).catch(function(error) {
        console.log('Error getting document:', error);
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
    const docRef = db.collection('sessions').doc(current_session).collection('cells').doc(`${i}`);
    var r_x = 0;
    const snapshot_cells = docRef.onSnapshot(function(doc) {
        //do stuff
        r_x++;

        if (r_x > 1) { // After 2nd snapshot
            const docRef = db.collection('sessions').doc(current_session).collection('cells').doc(`${i}`);

            docRef.get().then(function(doc) {
                window.cells = document.querySelectorAll('.cell');
                const result = doc.data();

                const fill = result.fill;
                const innerText = result.innerText;
                const bomb = result.bomb;

                function place_selection(fill) {
                    cells[i].dataset.fill = fill;
                    if (!fill === current_player) {
                        play_tone('explode');
                    }
                }
                fill === undefined ? no() : place_selection(fill);

                innerText === undefined ? no() : cells[i].innerText = innerText;
                bomb === undefined ? no() : cells[i].dataset.bomb = bomb;

                update_scoreboard();

            }).catch(function(error) {
                console.log('Error getting document:', error);
            });
        }

    });
    snapshots.push(snapshot_cells);
}

function add_death_snapshot_listener() {
    let death_count = 0; // Reset
    for (i = 0; i < scores.length; i++) {
        const player = scores[i].name.toLowerCase();

        const docRef = db.collection('sessions').doc(current_session).collection('scores').doc(player);

        const snapshot_scores = docRef.onSnapshot(function(doc) {
            docRef.get().then(function(doc) {
                if (doc.exists) {
                    const result = doc.data();

                    const dead = result.dead;
                    dead && death_count++;

                    if (death_count === (scores.length - 1)) { // If all but 1 died
                        // declare_win();
                        // Only works for host so far..
                    }
                } else {
                    // doc.data() will be undefined in this case
                    console.log('No such document!');
                }
            }).catch(function(error) {
                console.log('Error getting document:', error);
            });

        });
        snapshots.push(snapshot_scores);
    }
}

function unsubscribe_all() {
    console.log('Un-subing all snapshots...');
    snapshots.forEach(s => {
        s();
    });
    snapshots.length = 0; // Empty the array

    console.log('Ending Intervals...');
    typeof s_check != "undefined" && clearInterval(s_check);
    typeof c_check != "undefined" && clearInterval(c_check);
    typeof b_check != "undefined" && clearInterval(b_check);
}

// TASKS

// 1. Spend points after bomb defusal?
// 2. Add actual mini-game to death modal
// 3. Change score after death

// 4. Fix host controls not fitting on iPad

// 5. If all players are dead the game ends