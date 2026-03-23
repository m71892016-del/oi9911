let team1Name = "الفريق 1";
let team2Name = "الفريق 2";
let team1Score = 0;
let team2Score = 0;

let currentSubjectIndex = null;
let currentQuestionIndex = null;
let timerInterval = null;
let timeLeft = 30;
let timerStarted = false;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

let database = JSON.parse(localStorage.getItem('quizDatabase')) || [
    {
        subjectName: "المادة 1",
        questions: [
            { q: "سؤال 1 المادة 1: ما هو عاصمة العراق؟", options: ["بغداد", "البصرة", "أربيل", "الموصل"], correct: 0, isUsed: false },
            { q: "سؤال 2 المادة 1: ...", options: ["خيار 1", "خيار 2", "خيار 3", "خيار 4"], correct: 1, isUsed: false },
            { q: "سؤال 3 المادة 1: ...", options: ["خيار 1", "خيار 2", "خيار 3", "خيار 4"], correct: 2, isUsed: false },
            { q: "سؤال 4 المادة 1: ...", options: ["خيار 1", "خيار 2", "خيار 3", "خيار 4"], correct: 3, isUsed: false },
            { q: "سؤال 5 المادة 1: ...", options: ["خيار 1", "خيار 2", "خيار 3", "خيار 4"], correct: 0, isUsed: false },
            { q: "سؤال 6 المادة 1: ...", options: ["خيار 1", "خيار 2", "خيار 3", "خيار 4"], correct: 1, isUsed: false }
        ]
    },
    {
        subjectName: "المادة 2",
        questions: [
            { q: "سؤال 1 المادة 2: ...", options: ["1", "2", "3", "4"], correct: 0, isUsed: false },
            { q: "سؤال 2 المادة 2: ...", options: ["1", "2", "3", "4"], correct: 1, isUsed: false },
            { q: "سؤال 3 المادة 2: ...", options: ["1", "2", "3", "4"], correct: 2, isUsed: false },
            { q: "سؤال 4 المادة 2: ...", options: ["1", "2", "3", "4"], correct: 3, isUsed: false },
            { q: "سؤال 5 المادة 2: ...", options: ["1", "2", "3", "4"], correct: 0, isUsed: false },
            { q: "سؤال 6 المادة 2: ...", options: ["1", "2", "3", "4"], correct: 1, isUsed: false }
        ]
    },
    { subjectName: "المادة 3", questions: Array(6).fill(null).map((_, i) => ({ q: `سؤال ${i+1} المادة 3`, options: ["أ", "ب", "ج", "د"], correct: 0, isUsed: false })) },
    { subjectName: "المادة 4", questions: Array(6).fill(null).map((_, i) => ({ q: `سؤال ${i+1} المادة 4`, options: ["أ", "ب", "ج", "د"], correct: 0, isUsed: false })) }
];

function updateSubjectButtons() {
    for(let i=0; i<4; i++) {
        const btn = document.getElementById(`sub-btn-${i}`);
        if(btn && database[i]) {
            btn.innerText = database[i].subjectName;
        }
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    
    const target = document.getElementById(screenId);
    target.classList.remove('hidden');
    target.classList.add('active');
    updateSubjectButtons();
}

document.getElementById('btn-new-game').addEventListener('click', () => {
    showScreen('screen-setup');
});

document.getElementById('btn-enter').addEventListener('click', () => {
    const t1Input = document.getElementById('team1-input').value;
    const t2Input = document.getElementById('team2-input').value;
    
    if (t1Input) team1Name = t1Input;
    if (t2Input) team2Name = t2Input;

    document.getElementById('display-team1').innerText = team1Name;
    document.getElementById('display-team2').innerText = team2Name;
    
    document.getElementById('award-t1').innerText = `إضافة نقطة لـ (${team1Name})`;
    document.getElementById('award-t2').innerText = `إضافة نقطة لـ (${team2Name})`;

    showScreen('screen-board');
});

window.openSubject = function(subjectIndex) {
    currentSubjectIndex = subjectIndex;
    const subject = database[subjectIndex];
    
    document.getElementById('current-subject-title').innerText = subject.subjectName;
    
    const grid = document.getElementById('questions-grid');
    grid.innerHTML = ''; 
    
    subject.questions.forEach((q, index) => {
        const btn = document.createElement('button');
        btn.className = 'subject-btn';
        btn.innerText = `السؤال ${index + 1}`;
        
        if (q.isUsed) {
            btn.classList.add('used-question');
            btn.disabled = true;
        } else {
            btn.onclick = () => openQuestion(index);
        }
        grid.appendChild(btn);
    });
    
    const backToBoardBtn = document.getElementById('back-to-board-btn');
    if (backToBoardBtn) {
        backToBoardBtn.style.display = 'inline-block';
    }
    
    showScreen('screen-questions');
}

window.openQuestion = function(questionIndex) {
    currentQuestionIndex = questionIndex;
    const qData = database[currentSubjectIndex].questions[questionIndex];
    
    qData.isUsed = true;
    localStorage.setItem('quizDatabase', JSON.stringify(database));

    document.getElementById('question-text').innerText = qData.q;
    document.getElementById('turn-indicator').innerText = `السؤال ${questionIndex + 1}`;
    
    document.getElementById('active-score-t1-display').innerText = `${team1Name}: ${team1Score}`;
    document.getElementById('active-score-t2-display').innerText = `${team2Name}: ${team2Score}`;
    
    for (let i = 0; i < 4; i++) {
        const optBtn = document.getElementById(`opt${i}`);
        optBtn.innerText = qData.options[i];
        optBtn.classList.remove('correct-answer-anim');
        optBtn.classList.remove('wrong-answer-anim');
        optBtn.disabled = false;
    }
    
    timeLeft = 30;
    timerStarted = false;
    document.getElementById('timer-text').innerText = timeLeft;
    clearInterval(timerInterval);
    
    showScreen('screen-active-question');
}

window.nextQuestion = function() {
    clearInterval(timerInterval);
    const subject = database[currentSubjectIndex];
    if (currentQuestionIndex !== null && currentQuestionIndex < subject.questions.length - 1) {
        openQuestion(currentQuestionIndex + 1);
    } else {
        alert("لا يوجد أسئلة أخرى في هذه المادة، يرجى العودة للصفحة الرئيسية.");
        openSubject(currentSubjectIndex);
    }
}

document.getElementById('btn-start-timer').addEventListener('click', () => {
    if (timerStarted) return;
    timerStarted = true;
    clearInterval(timerInterval);
    timeLeft = 30;
    document.getElementById('timer-text').innerText = timeLeft;
    
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-text').innerText = timeLeft;
        playTickSound();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerStarted = false;
            handleTimeOut();
        }
    }, 1000);
});

function handleTimeOut() {
    const qData = database[currentSubjectIndex].questions[currentQuestionIndex];
    qData.isUsed = true;
    localStorage.setItem('quizDatabase', JSON.stringify(database));
    for (let i = 0; i < 4; i++) {
        document.getElementById(`opt${i}`).disabled = true;
    }
    const correctBtn = document.getElementById(`opt${qData.correct}`);
    correctBtn.classList.add('correct-answer-anim');
    correctBtn.innerText = correctBtn.innerText + " (هذه الإجابة الصحيحة)";
}

window.checkAnswer = function(selectedIndex) {
    clearInterval(timerInterval); 
    timerStarted = false;
    const qData = database[currentSubjectIndex].questions[currentQuestionIndex];
    qData.isUsed = true;
    localStorage.setItem('quizDatabase', JSON.stringify(database));
    
    if (selectedIndex === qData.correct) {
        const correctBtn = document.getElementById(`opt${selectedIndex}`);
        correctBtn.classList.add('correct-answer-anim');
        
        setTimeout(() => {
            document.getElementById('correct-modal').classList.remove('hidden');
        }, 3000);
    } else {
        document.getElementById(`opt${selectedIndex}`).classList.add('wrong-answer-anim');
    }
}

window.awardPoint = function(teamNumber) {
    if (teamNumber === 1) {
        team1Score++;
    } else if (teamNumber === 2) {
        team2Score++;
    } else if (teamNumber === 3) {
        team1Score++;
        team2Score++;
    }
    
    document.getElementById('score-team1').innerText = team1Score;
    document.getElementById('score-team2').innerText = team2Score;
    document.getElementById('active-score-t1-display').innerText = `${team1Name}: ${team1Score}`;
    document.getElementById('active-score-t2-display').innerText = `${team2Name}: ${team2Score}`;
    document.getElementById('correct-modal').classList.add('hidden');
    
    for (let i = 0; i < 4; i++) {
        document.getElementById(`opt${i}`).classList.remove('correct-answer-anim');
        document.getElementById(`opt${i}`).classList.remove('wrong-answer-anim');
    }
}

window.endGame = function() {
    let winMsg = "";
    if(team1Score > team2Score) {
        winMsg = `🎉 مبروك! فاز ${team1Name}! 🎉`;
    } else if (team2Score > team1Score) {
        winMsg = `🎉 مبروك! فاز ${team2Name}! 🎉`;
    } else {
        winMsg = `🎉 انتهت المسابقة! تعادل الفريقين! 🎉`;
    }

    const celebScreen = document.getElementById('celebration-screen');
    celebScreen.style.display = 'flex';
    
    let count = 5;
    const countDisplay = document.getElementById('countdown-display');
    countDisplay.style.display = 'block';
    countDisplay.innerText = count;

    const beepAudio = new Audio('./audio/beep_short.ogg');

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countDisplay.innerText = count;
            beepAudio.currentTime = 0;
            beepAudio.play().catch(e => console.log(e));
        } else {
            clearInterval(countdownInterval);
            countDisplay.style.display = 'none';
            
            const winnerDisplay = document.getElementById('winner-display');
            winnerDisplay.style.display = 'block';
            document.getElementById('winner-text').innerText = winMsg;
            
            const clapAudio = new Audio('./audio/stadium_crowd_cheer.ogg');
            clapAudio.play().catch(e => console.log(e));

            const victoryMusic = new Audio('./audio/brass_fanfare_with_timpani.ogg');
            victoryMusic.play().catch(e => console.log(e));
            
            createBalloons();
        }
    }, 1000);
}

function createBalloons() {
    const container = document.getElementById('balloons-container');
    const colors = ['#FF1744', '#00E676', '#2979FF', '#FFEA00', '#D500F9', '#FF9100'];
    for(let i=0; i<60; i++) {
        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        balloon.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        balloon.style.left = Math.random() * 100 + 'vw';
        balloon.style.animationDuration = (Math.random() * 4 + 3) + 's';
        balloon.style.animationDelay = (Math.random() * 2) + 's';
        
        const string = document.createElement('div');
        string.className = 'balloon-string';
        balloon.appendChild(string);
        
        container.appendChild(balloon);
    }
}

window.resetUsedQuestions = function() {
    database.forEach(subject => {
        subject.questions.forEach(q => {
            q.isUsed = false;
        });
    });
    localStorage.setItem('quizDatabase', JSON.stringify(database));
    alert('تم رفع التضليل عن جميع الأسئلة!');
}

window.closeModal = function() {
    document.getElementById('correct-modal').classList.add('hidden');
    for (let i = 0; i < 4; i++) {
        document.getElementById(`opt${i}`).classList.remove('correct-answer-anim');
        document.getElementById(`opt${i}`).classList.remove('wrong-answer-anim');
    }
}

window.openEditScreen = function() {
    const subSelect = document.getElementById('edit-subject-select');
    subSelect.innerHTML = '';
    database.forEach((sub, i) => {
        subSelect.innerHTML += `<option value="${i}">${sub.subjectName}</option>`;
    });
    loadEditSubject();
    showScreen('screen-edit');
}

window.loadEditSubject = function() {
    const subIndex = document.getElementById('edit-subject-select').value;
    const qSelect = document.getElementById('edit-question-select');
    qSelect.innerHTML = '';
    database[subIndex].questions.forEach((q, i) => {
        qSelect.innerHTML += `<option value="${i}">السؤال ${i+1}</option>`;
    });
    
    document.getElementById('edit-subject-name').value = database[subIndex].subjectName;
    loadEditQuestion();
}

window.loadEditQuestion = function() {
    const subIndex = document.getElementById('edit-subject-select').value;
    const qIndex = document.getElementById('edit-question-select').value;
    const qData = database[subIndex].questions[qIndex];
    
    document.getElementById('edit-q-text').value = qData.q;
    document.getElementById('edit-opt0').value = qData.options[0];
    document.getElementById('edit-opt1').value = qData.options[1];
    document.getElementById('edit-opt2').value = qData.options[2];
    document.getElementById('edit-opt3').value = qData.options[3];
    document.getElementById('edit-correct').value = qData.correct;
}

window.saveEditedQuestion = function() {
    const subIndex = document.getElementById('edit-subject-select').value;
    const qIndex = document.getElementById('edit-question-select').value;
    
    database[subIndex].subjectName = document.getElementById('edit-subject-name').value;
    database[subIndex].questions[qIndex].q = document.getElementById('edit-q-text').value;
    database[subIndex].questions[qIndex].options[0] = document.getElementById('edit-opt0').value;
    database[subIndex].questions[qIndex].options[1] = document.getElementById('edit-opt1').value;
    database[subIndex].questions[qIndex].options[2] = document.getElementById('edit-opt2').value;
    database[subIndex].questions[qIndex].options[3] = document.getElementById('edit-opt3').value;
    database[subIndex].questions[qIndex].correct = parseInt(document.getElementById('edit-correct').value);
    
    localStorage.setItem('quizDatabase', JSON.stringify(database));
    alert('تم الحفظ بنجاح!');
}
updateSubjectButtons();
