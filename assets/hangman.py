import json
import random
import string


DEFAULT_WORDS = [
    "python", "javascript", "hangman", "developer", "function", "variable",
    "asynchronous", "algorithm", "container", "vercel", "frontend",
    "backend", "framework", "library", "package", "virtual", "realtime",
    "websocket", "database", "testing", "pipeline", "browser", "session",
    "cookie", "security", "refactor", "optimize", "immutable", "iterator"
]


class HangmanGame:
    def __init__(self, max_attempts: int = 6, words=None):
        self.max_attempts = max_attempts
        self.words = list(words) if words else DEFAULT_WORDS
        self._choose_word()

    def _choose_word(self):
        self.secret = random.choice(self.words).lower()
        self.guessed_letters = set()
        self.wrong_letters = []
        self.status = "playing"  # playing | won | lost

    def masked_word(self) -> str:
        return " ".join([c if c in self.guessed_letters else "_" for c in self.secret])

    def guess(self, raw_letter: str):
        if self.status != "playing":
            return self.get_state()
        if not raw_letter:
            return self.get_state()
        letter = raw_letter.lower().strip()
        if len(letter) != 1 or letter not in string.ascii_lowercase:
            return self.get_state()

        if letter in self.guessed_letters or letter in self.wrong_letters:
            return self.get_state()

        if letter in self.secret:
            self.guessed_letters.add(letter)
        else:
            self.wrong_letters.append(letter)

        if all(c in self.guessed_letters for c in set(self.secret)):
            self.status = "won"
        elif len(self.wrong_letters) >= self.max_attempts:
            self.status = "lost"
        return self.get_state()

    def reveal(self):
        self.guessed_letters.update(set(self.secret))
        if self.status == "playing":
            self.status = "lost"
        return self.get_state()

    def get_state(self):
        return {
            "masked": self.masked_word(),
            "guessed": sorted(list(self.guessed_letters)),
            "wrong": self.wrong_letters,
            "remaining": self.max_attempts - len(self.wrong_letters),
            "status": self.status,
            "word_length": len(self.secret),
            "secret": self.secret if self.status != "playing" else None,
        }


# Simple JSON helpers for JS interop via Pyodide
_game_instance = HangmanGame()


def py_new_game() -> str:
    global _game_instance
    _game_instance = HangmanGame()
    return json.dumps(_game_instance.get_state())


def py_guess(letter: str) -> str:
    return json.dumps(_game_instance.guess(letter))


def py_reveal() -> str:
    return json.dumps(_game_instance.reveal())


def py_state() -> str:
    return json.dumps(_game_instance.get_state())
