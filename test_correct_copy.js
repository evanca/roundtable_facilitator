#!/usr/bin/env node

/**
 * Test to verify that the HTML file contains the correct copy from JSON files
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = './fluttercon_2025_ai_roundtable.html';
const AI_DIR = './fluttercon_2025_ai';
const MONETIZATION_DIR = './fluttercon_2025_monetization';

class CopyVerificationTest {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.passed = 0;
        this.total = 0;
    }

    async runAllTests() {
        console.log('🧪 Starting copy verification tests...\n');

        try {
            // Load expected data from JSON files
            const expectedAiData = await this.loadJsonFiles(AI_DIR);
            const expectedMonetizationData = await this.loadJsonFiles(MONETIZATION_DIR);

            // Extract embedded data from HTML
            const embeddedData = await this.extractEmbeddedData();

            // Run tests
            await this.testAiData(expectedAiData, embeddedData.ai);
            await this.testMonetizationData(expectedMonetizationData, embeddedData.monetization);
            await this.testStructuralIntegrity(embeddedData);

            // Report results
            this.reportResults();

        } catch (error) {
            console.error('❌ Test suite failed to run:', error.message);
            process.exit(1);
        }
    }

    async loadJsonFiles(directory) {
        const data = {};
        
        for (let i = 1; i <= 6; i++) {
            const filePath = path.join(directory, `q${i}.json`);
            try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const jsonData = JSON.parse(fileContent);
                data[`q${i}`] = jsonData;
            } catch (error) {
                this.addError(`Failed to load ${filePath}: ${error.message}`);
            }
        }
        
        return data;
    }

    async extractEmbeddedData() {
        const htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
        
        // Extract the embedded data using regex
        const dataMatch = htmlContent.match(/const embeddedData = ({[\s\S]*?});/);
        if (!dataMatch) {
            throw new Error('Could not find embedded data in HTML file');
        }

        try {
            // Parse the JavaScript object
            const dataString = dataMatch[1];
            return eval(`(${dataString})`);
        } catch (error) {
            throw new Error(`Failed to parse embedded data: ${error.message}`);
        }
    }

    async testAiData(expected, actual) {
        console.log('📋 Testing AI data...');
        
        for (let i = 1; i <= 6; i++) {
            const qKey = `q${i}`;
            const expectedQ = expected[qKey];
            const actualQ = actual[qKey];

            if (!expectedQ) {
                this.addWarning(`Expected AI ${qKey} data not found in JSON files`);
                continue;
            }

            if (!actualQ) {
                this.addError(`AI ${qKey} data missing from HTML`);
                continue;
            }

            // Test sections
            this.testSections(expectedQ.sections, actualQ.sections, `AI ${qKey}`);
            
            // Test wrap_up
            this.testArray(expectedQ.wrap_up, actualQ.wrap_up, `AI ${qKey} wrap_up`);
        }
    }

    async testMonetizationData(expected, actual) {
        console.log('💰 Testing Monetization data...');
        
        for (let i = 1; i <= 6; i++) {
            const qKey = `q${i}`;
            const expectedQ = expected[qKey];
            const actualQ = actual[qKey];

            if (!expectedQ) {
                this.addWarning(`Expected Monetization ${qKey} data not found in JSON files`);
                continue;
            }

            if (!actualQ) {
                this.addError(`Monetization ${qKey} data missing from HTML`);
                continue;
            }

            // Test sections
            this.testSections(expectedQ.sections, actualQ.sections, `Monetization ${qKey}`);
            
            // Test wrap_up
            this.testArray(expectedQ.wrap_up, actualQ.wrap_up, `Monetization ${qKey} wrap_up`);
        }
    }

    testSections(expectedSections, actualSections, context) {
        if (!expectedSections || !actualSections) {
            this.addError(`${context}: sections missing`);
            return;
        }

        if (expectedSections.length !== actualSections.length) {
            this.addError(`${context}: section count mismatch. Expected ${expectedSections.length}, got ${actualSections.length}`);
            return;
        }

        expectedSections.forEach((expectedSection, index) => {
            const actualSection = actualSections[index];
            const sectionContext = `${context} section ${index + 1}`;

            // Test title (maps from model field)
            this.testString(expectedSection.model, actualSection.title, `${sectionContext} title`);
            
            // Test prompt
            this.testString(expectedSection.prompt, actualSection.prompt, `${sectionContext} prompt`);
            
            // Test hints (maps from hint field)
            this.testString(expectedSection.hint, actualSection.hints, `${sectionContext} hints`);
            
            // Test no_hands array
            this.testArray(expectedSection.no_hands, actualSection.no_hands, `${sectionContext} no_hands`);
            
            // Test hands_up array
            this.testArray(expectedSection.hands_up, actualSection.hands_up, `${sectionContext} hands_up`);
        });
    }

    testString(expected, actual, context) {
        this.total++;
        
        if (expected === undefined && actual === undefined) {
            this.passed++;
            return;
        }

        if (expected !== actual) {
            this.addError(`${context}: text mismatch\n  Expected: "${expected}"\n  Actual:   "${actual}"`);
            return;
        }

        this.passed++;
    }

    testArray(expected, actual, context) {
        this.total++;

        if (!expected && !actual) {
            this.passed++;
            return;
        }

        if (!expected || !actual) {
            this.addError(`${context}: array missing. Expected: ${!!expected}, Actual: ${!!actual}`);
            return;
        }

        if (expected.length !== actual.length) {
            this.addError(`${context}: array length mismatch. Expected ${expected.length}, got ${actual.length}`);
            return;
        }

        let arrayMatches = true;
        expected.forEach((expectedItem, index) => {
            if (expectedItem !== actual[index]) {
                this.addError(`${context}[${index}]: "${expectedItem}" !== "${actual[index]}"`);
                arrayMatches = false;
            }
        });

        if (arrayMatches) {
            this.passed++;
        }
    }

    async testStructuralIntegrity(embeddedData) {
        console.log('🏗️  Testing structural integrity...');

        // Test that both ai and monetization exist
        this.testExists(embeddedData.ai, 'AI data');
        this.testExists(embeddedData.monetization, 'Monetization data');

        // Test that each has 6 questions
        if (embeddedData.ai) {
            const aiQuestions = Object.keys(embeddedData.ai).filter(key => key.startsWith('q'));
            this.testEquals(aiQuestions.length, 6, 'AI questions count');
        }

        if (embeddedData.monetization) {
            const monQuestions = Object.keys(embeddedData.monetization).filter(key => key.startsWith('q'));
            this.testEquals(monQuestions.length, 6, 'Monetization questions count');
        }

        // Test question titles in HTML function
        await this.testQuestionTitles();
    }

    async testQuestionTitles() {
        console.log('📝 Testing question titles...');
        
        const htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
        
        // Extract the getQuestionTitle function and its titles
        const titleMatch = htmlContent.match(/const titles = \{[\s\S]*?\};/);
        if (!titleMatch) {
            this.addError('Could not find question titles in HTML');
            return;
        }

        // Load expected titles from JSON files
        const expectedTitles = {
            ai: [],
            monetization: []
        };

        // Get AI titles
        for (let i = 1; i <= 6; i++) {
            const filePath = path.join(AI_DIR, `q${i}.json`);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            expectedTitles.ai.push(data.question);
        }

        // Get Monetization titles
        for (let i = 1; i <= 6; i++) {
            const filePath = path.join(MONETIZATION_DIR, `q${i}.json`);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            expectedTitles.monetization.push(data.question);
        }

        // Extract actual titles from HTML
        const aiTitlesMatch = htmlContent.match(/ai: \[([\s\S]*?)\]/);
        const monTitlesMatch = htmlContent.match(/monetization: \[([\s\S]*?)\]/);

        if (aiTitlesMatch) {
            const aiTitlesStr = aiTitlesMatch[1];
            const actualAiTitles = aiTitlesStr.match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) || [];
            
            expectedTitles.ai.forEach((expected, index) => {
                this.testString(expected, actualAiTitles[index], `AI Q${index + 1} title`);
            });
        }

        if (monTitlesMatch) {
            const monTitlesStr = monTitlesMatch[1];
            const actualMonTitles = monTitlesStr.match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) || [];
            
            expectedTitles.monetization.forEach((expected, index) => {
                this.testString(expected, actualMonTitles[index], `Monetization Q${index + 1} title`);
            });
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

    addError(message) {
        this.errors.push(message);
    }

    addWarning(message) {
        this.warnings.push(message);
    }

    reportResults() {
        console.log('\n📊 Test Results:');
        console.log('================');
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.warnings.forEach(warning => console.log(`   ${warning}`));
        }

        if (this.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.errors.forEach(error => console.log(`   ${error}`));
        }

        console.log(`\n✅ Tests passed: ${this.passed}/${this.total}`);
        console.log(`❌ Tests failed: ${this.total - this.passed}/${this.total}`);
        
        if (this.errors.length === 0) {
            console.log('\n🎉 All tests passed! The HTML contains the correct copy from the JSON files.');
            process.exit(0);
        } else {
            console.log('\n💥 Some tests failed. Please check the errors above.');
            process.exit(1);
        }
    }
}

// Run the tests
const test = new CopyVerificationTest();
test.runAllTests();