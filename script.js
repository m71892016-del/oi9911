// ================= المتغيرات الأساسية =================
let team1Name = "الفريق 1";
let team2Name = "الفريق 2";
let team1Score = 0;
let team2Score = 0;
const winScore = 10;

let currentSubjectIndex = null;
let currentQuestionIndex = null;
let timerInterval = null;
let timeLeft = 30;

// إعداد الصوت (نغمة التيك تاك) باستخدام Web Audio API لضمان عملها بدون ملفات خارجية
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'triangle'; // نوع الصوت
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // التردد
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // مستوى الصوت
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1); // تلاشي الصوت
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

// ================= قاعدة بيانات الأسئلة =================
// 4 مواد، كل مادة 6 أسئلة (المجموع 24). يمكنك تعديل النصوص كما تشاء.
const database = [
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
    // مادة 3
    { subjectName: "المادة 3", questions: Array(6).fill(null).map((_, i) => ({ q: `سؤال ${i+1} المادة 3`, options: ["أ", "ب", "ج", "د"], correct: 0, isUsed: false })) },
    // مادة 4
    { subjectName: "المادة 4", questions: Array(6).fill(null).map((_, i) => ({ q: `سؤال ${i+1} المادة 4`, options: ["أ", "ب", "ج", "د"], correct: 0, isUsed: false })) }
];


// ================= دوال التنقل بين الشاشات =================
function showScreen(screenId) {
    // إخفاء جميع الشاشات
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    
    // إظهار الشاشة المطلوبة
    const target = document.getElementById(screenId);
    target.classList.remove('hidden');
    target.classList.add('active');
}

// ================= إدارة الأحداث (Events) =================

// زر مسابقة جديدة
document.getElementById('btn-new-game').addEventListener('click', () => {
    showScreen('screen-setup');
});

// زر الدخول وتعيين الأسماء
document.getElementById('btn-enter').addEventListener('click', () => {
    const t1Input = document.getElementById('team1-input').value;
    const t2Input = document.getElementById('team2-input').value;
    
    if (t1Input) team1Name = t1Input;
    if (t2Input) team2Name = t2Input;

    document.getElementById('display-team1').innerText = team1Name;
    document.getElementById('display-team2').innerText = team2Name;
    
    // تحديث أزرار النافذة المنبثقة
    document.getElementById('award-t1').innerText = `إضافة نقطة لـ (${team1Name})`;
    document.getElementById('award-t2').innerText = `إضافة نقطة لـ (${team2Name})`;

    showScreen('screen-board');
});

// فتح مادة معينة وعرض أسئلتها الـ 6
window.openSubject = function(subjectIndex) {
    currentSubjectIndex = subjectIndex;
    const subject = database[subjectIndex];
    
    document.getElementById('current-subject-title').innerText = subject.subjectName;
    
    const grid = document.getElementById('questions-grid');
    grid.innerHTML = ''; // تفريغ الشبكة
    
    subject.questions.forEach((q, index) => {
        const btn = document.createElement('button');
        btn.className = 'subject-btn';
        btn.innerText = `السؤال ${index + 1}`;
        // إذا تم الإجابة على السؤال سابقاً نجعله غير مفعل
        if (q.isUsed) {
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.disabled = true;
        } else {
            btn.onclick = () => openQuestion(index);
        }
        grid.appendChild(btn);
    });
    
    showScreen('screen-questions');
}

// فتح سؤال محدد
window.openQuestion = function(questionIndex) {
    currentQuestionIndex = questionIndex;
    const qData = database[currentSubjectIndex].questions[questionIndex];
    
    document.getElementById('question-text').innerText = qData.q;
    
    // وضع الخيارات في الأزرار
    for (let i = 0; i < 4; i++) {
        document.getElementById(`opt${i}`).innerText = qData.options[i];
    }
    
    showScreen('screen-active-question');
    startTimer();
}

// ================= المؤقت الزمني =================
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 30;
    document.getElementById('timer-text').innerText = timeLeft;
    
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-text').innerText = timeLeft;
        playTickSound(); // تشغيل صوت التيك
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("انتهى الوقت!");
            showScreen('screen-questions'); // العودة لأسئلة المادة
        }
    }, 1000);
}

// ================= التحقق من الإجابة =================
window.checkAnswer = function(selectedIndex) {
    clearInterval(timerInterval); // إيقاف المؤقت
    const qData = database[currentSubjectIndex].questions[currentQuestionIndex];
    
    if (selectedIndex === qData.correct) {
        // إجابة صحيحة
        qData.isUsed = true; // تم استخدام السؤال
        document.getElementById('correct-modal').classList.remove('hidden');
    } else {
        // إجابة خاطئة
        alert("إجابة خاطئة!");
        qData.isUsed = true;
        showScreen('screen-questions'); // العودة للمادة
    }
}

// ================= إضافة النقاط =================
window.awardPoint = function(teamNumber) {
    if (teamNumber === 1) {
        team1Score++;
        document.getElementById('score-team1').innerText = team1Score;
    } else {
        team2Score++;
        document.getElementById('score-team2').innerText = team2Score;
    }
    
    document.getElementById('correct-modal').classList.add('hidden'); // إخفاء النافذة
    
    // التحقق من الفوز
    if (team1Score >= winScore) {
        alert(`🎉 مبرووووك! فاز ${team1Name} بالمسابقة!`);
        location.reload(); // إعادة تحميل الصفحة للبدء من جديد
    } else if (team2Score >= winScore) {
        alert(`🎉 مبرووووك! فاز ${team2Name} بالمسابقة!`);
        location.reload();
    } else {
        showScreen('screen-board'); // العودة للوحة الرئيسية
    }
}
