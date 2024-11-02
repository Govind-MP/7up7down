from flask import Flask, render_template, request, jsonify
from random import randint
import time

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', balance=1000)

@app.route('/play', methods=['POST'])
def play():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        bet = data.get('bet')
        guess = data.get('guess')
        money = data.get('money')
        
        # Validate input
        if not all(isinstance(x, (int, float)) for x in [bet, money]):
            return jsonify({"error": "Invalid bet or money amount"}), 400
        
        if bet <= 0:
            return jsonify({"error": "Bet amount must be positive"}), 400
        
        if bet > money:
            return jsonify({"error": "Not enough balance for this bet"}), 400
        
        if guess not in ['higher', 'lower', 'exact']:
            return jsonify({"error": "Invalid guess"}), 400
        
        # Generate random dice roll (sum of two dice)
        number = randint(2, 12)
        
        # Calculate outcome
        result = {
            "number": number,
            "outcome": "lost",
            "new_money": money - bet  # Default to loss
        }
        
        # Check win conditions
        if (guess == "higher" and number > 7) or \
           (guess == "lower" and number < 7) or \
           (guess == "exact" and number == 7):
            # Award winnings
            win_multiplier = 3 if guess == "exact" else 2  # 3x for exact, 2x for higher/lower
            winnings = bet * (win_multiplier - 1)  # Subtract 1 to account for original bet
            result["outcome"] = "won_exactly" if guess == "exact" else "won"
            result["new_money"] = money + winnings
        
        # Add a small delay to simulate server processing
        time.sleep(0.5)
        
        return jsonify(result)
        
    except Exception as e:
        app.logger.error(f"Error processing game: {str(e)}")
        return jsonify({"error": "Server error occurred"}), 500

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True)