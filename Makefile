.PHONY: setup install dev format format-check lint check-dependencies typecheck test build check

setup:
	./scripts/setup-development.sh

install:
	npm install

dev:
	npm run dev

format:
	npm run format

format-check:
	npm run format:check

lint:
	npm run lint

check-dependencies:
	npm run check:dependencies

typecheck:
	npm run typecheck

test:
	npm run test

build:
	npm run build

check:
	npm run check
