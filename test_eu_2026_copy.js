#!/usr/bin/env node

/**
 * Verify that the FlutterCon EU 2026 HTML embeds the expected JSON copy.
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = './fluttercon_eu_2026_flutter_ai_job_market.html';
const DATA_DIR = './fluttercon_eu_2026_flutter_ai_job_market';
const TOPIC_KEY = 'flutter_ai_job_market_eu';

class CopyVerificationTest {
    constructor() {
        this.errors = [];
        this.passed = 0;
        this.total = 0;
    }

    runAllTests() {
        console.log('Starting FlutterCon EU 2026 copy verification tests...\n');

        const expectedData = this.loadJsonFiles(DATA_DIR);
        const embeddedData = this.extractEmbeddedData();

        this.testExists(embeddedData[TOPIC_KEY], 'EU 2026 topic data');
        this.testTopicData(expectedData, embeddedData[TOPIC_KEY]);
        this.testQuestionTitles(expectedData);
        this.testContentRules(expectedData);
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
        const titlesMatch = htmlContent.match(new RegExp(TOPIC_KEY + ': \\[([\\s\\S]*?)\\]'));
        if (!titlesMatch) {
            this.addError('Could not find EU 2026 question titles in HTML');
            return;
        }

        const actualTitles = eval(`[${titlesMatch[1]}]`);

        for (let i = 1; i <= 6; i++) {
            this.testString(expected[`q${i}`].question, actualTitles[i - 1], `Q${i} title`);
        }
    }

    // The rules the page is written to: sayable prompts, one-breath hints, one idea per question,
    // a named source for every number, and nothing on screen that primes the eyes-closed count.
    testContentRules(expected) {
        const htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
        const wordCount = text => text.trim().split(/\s+/).length;
        const sourcesMatch = htmlContent.match(/<details class="sources">([\s\S]*?)<\/details>/);
        const sourceLeads = sourcesMatch
            ? [...sourcesMatch[1].matchAll(/<li><strong>([^<]+)<\/strong>/g)].map(match => match[1].split(',')[0].trim().toLowerCase())
            : [];
        this.testEquals(sourceLeads.length > 0, true, 'Sources block has labelled entries');

        for (let i = 1; i <= 6; i++) {
            expected[`q${i}`].sections.forEach((section, index) => {
                const context = `Q${i}S${index + 1}`;
                const questions = [...section.no_hands, ...section.hands_up, ...section.follow_ups];
                const hint = section.hint.toLowerCase();

                this.testEquals(section.prompt.startsWith('Raise your hand if'), true, `${context} prompt starts with "Raise your hand if"`);
                this.testEquals(wordCount(section.prompt) < 20, true, `${context} prompt under 20 words (${wordCount(section.prompt)})`);
                this.testEquals(wordCount(section.hint) < 28, true, `${context} hint under 28 words (${wordCount(section.hint)})`);
                this.testEquals(section.no_hands.length, 3, `${context} No Hands count`);
                this.testEquals(section.hands_up.length >= 3 && section.hands_up.length <= 4, true, `${context} Hands Up count is 3 or 4 (${section.hands_up.length})`);
                this.testEquals(section.follow_ups.length >= 1 && section.follow_ups.length <= 2, true, `${context} follow-up count is 1 or 2 (${section.follow_ups.length})`);
                questions.forEach(question => {
                    this.testEquals(wordCount(question) < 18, true, `${context} question under 18 words: "${question}"`);
                });
                this.testEquals(sourceLeads.some(lead => hint.includes(lead)), true, `${context} hint names a source from the Sources block`);
                this.testEquals(hint.includes('eyes closed'), false, `${context} hint does not show the eyes-closed move`);
            });
        }

        for (let i = 1; i <= 6; i++) {
            const raw = fs.readFileSync(path.join(DATA_DIR, `q${i}.json`), 'utf8');
            this.testEquals(/[\u2013\u2014]/.test(raw), false, `q${i}.json has no en or em dash`);
        }
        this.testEquals(/[\u2013\u2014]/.test(htmlContent), false, 'Berlin page has no en or em dash');

        ['roulette-result-title', 'roulette-result-prompt', 'roulette-result-hint'].forEach(className => {
            this.testEquals(htmlContent.includes(`class="${className}"`), true, `roulette template uses .${className}`);
            this.testEquals(htmlContent.includes(`.${className} {`), true, `projector CSS sizes .${className}`);
        });
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
