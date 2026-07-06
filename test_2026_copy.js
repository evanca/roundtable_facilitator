#!/usr/bin/env node

/**
 * Verify that the FlutterCon USA 2026 HTML embeds the expected JSON copy.
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = './fluttercon_usa_2026_flutter_ai_job_market.html';
const DATA_DIR = './fluttercon_usa_2026_flutter_ai_job_market';
const TOPIC_KEY = 'flutter_ai_job_market';

class CopyVerificationTest {
    constructor() {
        this.errors = [];
        this.passed = 0;
        this.total = 0;
    }

    runAllTests() {
        console.log('Starting FlutterCon USA 2026 copy verification tests...\n');

        const expectedData = this.loadJsonFiles(DATA_DIR);
        const embeddedData = this.extractEmbeddedData();

        this.testExists(embeddedData[TOPIC_KEY], '2026 topic data');
        this.testTopicData(expectedData, embeddedData[TOPIC_KEY]);
        this.testQuestionTitles(expectedData);
        this.reportResults();
    }

    loadJsonFiles(directory) {
        const data = {};

        for (let i = 1; i <= 6; i++) {
            const filePath = path.join(directory, `q${i}.json`);
            data[`q${i}`] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        return data;
    }

    extractEmbeddedData() {
        const htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
        const dataMatch = htmlContent.match(/const embeddedData = ({[\s\S]*?});/);
        if (!dataMatch) {
            throw new Error('Could not find embedded data in HTML file');
        }

        return eval(`(${dataMatch[1]})`);
    }

    testTopicData(expected, actual) {
        for (let i = 1; i <= 6; i++) {
            const qKey = `q${i}`;
            const expectedQ = expected[qKey];
            const actualQ = actual[qKey];

            this.testExists(actualQ, `${qKey} data`);
            this.testSections(expectedQ.sections, actualQ.sections, qKey);
            this.testArray(expectedQ.wrap_up, actualQ.wrap_up, `${qKey} wrap_up`);
        }
    }

    testSections(expectedSections, actualSections, context) {
        this.testEquals(actualSections.length, expectedSections.length, `${context} section count`);

        expectedSections.forEach((expectedSection, index) => {
            const actualSection = actualSections[index];
            const sectionContext = `${context} section ${index + 1}`;

            this.testString(expectedSection.model, actualSection.title, `${sectionContext} title`);
            this.testString(expectedSection.prompt, actualSection.prompt, `${sectionContext} prompt`);
            this.testString(expectedSection.hint, actualSection.hints, `${sectionContext} hints`);
            this.testArray(expectedSection.no_hands, actualSection.no_hands, `${sectionContext} no_hands`);
            this.testArray(expectedSection.hands_up, actualSection.hands_up, `${sectionContext} hands_up`);
            this.testArray(expectedSection.follow_ups, actualSection.follow_ups, `${sectionContext} follow_ups`);
        });
    }

    testQuestionTitles(expected) {
        const htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
        const titlesMatch = htmlContent.match(/flutter_ai_job_market: \[([\s\S]*?)\]/);
        if (!titlesMatch) {
            this.addError('Could not find 2026 question titles in HTML');
            return;
        }

        const actualTitles = titlesMatch[1].match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) || [];

        for (let i = 1; i <= 6; i++) {
            this.testString(expected[`q${i}`].question, actualTitles[i - 1], `Q${i} title`);
        }
    }

    testExists(value, context) {
        this.total++;
        if (value !== undefined && value !== null) {
            this.passed++;
        } else {
            this.addError(`${context}: does not exist`);
        }
    }

    testEquals(actual, expected, context) {
        this.total++;
        if (actual === expected) {
            this.passed++;
        } else {
            this.addError(`${context}: expected ${expected}, got ${actual}`);
        }
    }

    testString(expected, actual, context) {
        this.total++;
        if (expected === actual) {
            this.passed++;
        } else {
            this.addError(`${context}: text mismatch\n  Expected: "${expected}"\n  Actual:   "${actual}"`);
        }
    }

    testArray(expected, actual, context) {
        this.total++;

        if (!Array.isArray(expected) || !Array.isArray(actual)) {
            this.addError(`${context}: expected arrays`);
            return;
        }

        if (expected.length !== actual.length) {
            this.addError(`${context}: array length mismatch. Expected ${expected.length}, got ${actual.length}`);
            return;
        }

        const matches = expected.every((item, index) => item === actual[index]);
        if (matches) {
            this.passed++;
        } else {
            this.addError(`${context}: array contents mismatch`);
        }
    }

    addError(message) {
        this.errors.push(message);
    }

    reportResults() {
        console.log('Test Results:');
        console.log('=============');

        if (this.errors.length > 0) {
            console.log('\nErrors:');
            this.errors.forEach(error => console.log(`   ${error}`));
        }

        console.log(`\nTests passed: ${this.passed}/${this.total}`);
        console.log(`Tests failed: ${this.total - this.passed}/${this.total}`);

        if (this.errors.length > 0) {
            process.exit(1);
        }
    }
}

new CopyVerificationTest().runAllTests();
