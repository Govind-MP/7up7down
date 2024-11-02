let balance = 1000;
let isRolling = false;

// Initialize GSAP timeline
const tl = gsap.timeline();

function startGame() {
    const startingMoney = parseInt(document.getElementById("starting-money").value);
    if (startingMoney < 100) {
        showNotification("Please enter at least ₹100 to start", "error");
        return;
    }
    
    balance = startingMoney;
    updateBalance();
    
    document.getElementById("setupSection").classList.add("hidden");
    document.getElementById("gameSection").classList.remove("hidden");
    
    showNotification("Game started! Good luck!", "success");
}

function updateBalance() {
    document.getElementById("balance").textContent = balance;
}

function quickBet(amount) {
    const betInput = document.getElementById("bet");
    const currentBet = parseInt(betInput.value) || 0;
    betInput.value = currentBet + amount;
}

function clearBet() {
    document.getElementById("bet").value = "100";
}

function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.style.background = type === "success" ? "#2ecc71" : "#e74c3c";
    notification.classList.add("show");
    
    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

function createDiceFace(dice, value) {
    // Clear previous dots
    dice.innerHTML = '';
    
    // Create dots based on dice value
    const dotPositions = {
        1: [5],
        2: [1, 9],
        3: [1, 5, 9],
        4: [1, 3, 7, 9],
        5: [1, 3, 5, 7, 9],
        6: [1, 3, 4, 6, 7, 9]
    };
    
    const positions = dotPositions[value];
    positions.forEach(pos => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dice.appendChild(dot);
    });
}

function rollDice() {
    const dice1 = document.getElementById("dice1");
    const dice2 = document.getElementById("dice2");
    
    dice1.classList.add("rolling");
    dice2.classList.add("rolling");
    // Random rotation for more realistic effect
    gsap.to([dice1, dice2], {
        duration: 2,
        rotationX: "random(-720, 720)",
        rotationY: "random(-720, 720)",
        ease: "power2.out"
    });

    return new Promise((resolve) => {
        setTimeout(() => {
            dice1.classList.remove("rolling");
            dice2.classList.remove("rolling");
            resolve();
        }, 2000);
    });
}

function createConfetti() {
    const container = document.getElementById("confetti-container");
    const colors = ['#2ecc71', '#3498db', '#e74c3c', '#f1c40f', '#9b59b6'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.opacity = Math.random();
        container.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => confetti.remove(), 5000);
    }
}

async function submitGuess(guess) {
    if (isRolling) {
        showNotification("Wait for current roll to complete!", "error");
        return;
    }
    
    const betAmount = parseInt(document.getElementById("bet").value);
    if (betAmount <= 0 || isNaN(betAmount)) {
        showNotification("Please enter a valid bet amount!", "error");
        return;
    }
    
    if (betAmount > balance) {
        showNotification("Bet amount exceeds your balance!", "error");
        return;
    }
    
    isRolling = true;
    document.getElementById("diceTotal").textContent = "Rolling...";
    document.getElementById("resultMessage").textContent = "";
    
    try {
        const response = await fetch('/play', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bet: betAmount,
                guess: guess,
                money: balance
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            showNotification(data.error, "error");
            isRolling = false;
            return;
        }
        
        // Roll the dice with animation
        await rollDice();
        
        // Calculate individual dice values that sum to the total
        const total = data.number;
        let dice1Value = Math.min(6, Math.floor(Math.random() * (total - 1)) + 1);
        let dice2Value = total - dice1Value;
        
        // Adjust if second die is invalid
        if (dice2Value > 6 || dice2Value < 1) {
            dice1Value = Math.min(6, Math.floor(total/2));
            dice2Value = total - dice1Value;
        }
        
        // Update dice faces
        createDiceFace(document.getElementById("dice1"), dice1Value);
        createDiceFace(document.getElementById("dice2"), dice2Value);
        
        // Update result display
        document.getElementById("diceTotal").textContent = `Total: ${total}`;
        
        // Update balance and show result
        balance = data.new_money;
        updateBalance();
        
        let resultMessage = "";
        if (data.outcome === "won" || data.outcome === "won_exactly") {
            resultMessage = "Congratulations! You Won! 🎉";
            createConfetti();
            showNotification("You Won! 🎉", "success");
        } else {
            resultMessage = "Better luck next time! 😢";
            showNotification("Better luck next time!", "error");
        }
        
        document.getElementById("resultMessage").textContent = resultMessage;
        
        // Add win/lose animation to balance
        gsap.from("#balance", {
            scale: 1.2,
            duration: 0.5,
            ease: "elastic.out(1, 0.3)",
            color: data.outcome.includes("won") ? "#2ecc71" : "#e74c3c"
        });
        
    } catch (error) {
        console.error('Error:', error);
        showNotification("Something went wrong! Please try again.", "error");
    } finally {
        isRolling = false;
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    updateBalance();
});