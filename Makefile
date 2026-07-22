.PHONY: lint test check

# Run flake8 linter
lint:
	flake8 src/ scripts/ tests/ --count --select=E9,F63,F7,F82 --show-source --statistics
	flake8 src/ scripts/ tests/ --count --max-complexity=10 --max-line-length=127 --statistics

# Run pytest
test:
	pytest tests/

# Run all checks
check: lint test
