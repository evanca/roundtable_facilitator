#!/usr/bin/env node

/**
 * Inject FlutterCon USA 2026 roundtable JSON into the standalone HTML app.
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = './fluttercon_usa_2026_flutter_ai_job_market.html';
const DATA_DIR = './fluttercon_usa_2026_flutter_ai_job_market';
const TOPIC_KEY = 'flutter_ai_job_market';

function loadJsonFiles(directory) {
    const data = {};

    for (let i = 1; i <= 6; i++) {
        const filePath = path.join(directory, `q${i}.json`);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);

        data[`q${i}`] = {
            sections: jsonData.sections.map(section => ({
                title: section.model,
                prompt: section.prompt,
                hints: section.hint,
                no_hands: section.no_hands || [],
                hands_up: section.hands_up || [],
                follow_ups: section.follow_ups || []
            })),
            wrap_up: jsonData.wrap_up || []
        };
    }

    return data;
}

function updateHtmlFile() {
    console.log('Loading FlutterCon USA 2026 JSON data...');

    const topicData = loadJsonFiles(DATA_DIR);
    const newEmbeddedData = {
        [TOPIC_KEY]: topicData
    };

    console.log('Reading HTML file...');
    const htmlContent = fs.readFileSync(HTML_FILE, 'utf8');

    const dataStartPattern = /const embeddedData = {/;
    const dataEndPattern = /^};$/m;

    const startMatch = htmlContent.match(dataStartPattern);
    if (!startMatch) {
        throw new Error('Could not find embedded data start pattern');
    }

    const startIndex = startMatch.index;
    const beforeData = htmlContent.substring(0, startIndex);
    const afterStart = htmlContent.substring(startIndex);
    const endMatch = afterStart.match(dataEndPattern);
    if (!endMatch) {
        throw new Error('Could not find embedded data end pattern');
    }

    const endIndex = startIndex + endMatch.index + endMatch[0].length;
    const afterData = htmlContent.substring(endIndex);
    const newDataString = `const embeddedData = ${JSON.stringify(newEmbeddedData, null, 12)};`;

    fs.writeFileSync(HTML_FILE, beforeData + newDataString + afterData);
    console.log('Successfully updated 2026 HTML with JSON data.');
}

try {
    updateHtmlFile();
} catch (error) {
    console.error('Error updating HTML file:', error.message);
    process.exit(1);
}
