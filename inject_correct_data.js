#!/usr/bin/env node

/**
 * Script to inject correct JSON data into HTML file
 * This replaces the embedded data in the HTML with the correct data from JSON files
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = './fluttercon_2025_ai_roundtable.html';
const AI_DIR = './fluttercon_2025_ai';
const MONETIZATION_DIR = './fluttercon_2025_monetization';

async function loadJsonFiles(directory) {
    const data = {};
    
    for (let i = 1; i <= 6; i++) {
        const filePath = path.join(directory, `q${i}.json`);
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(fileContent);
            
            // Transform the data to match the expected structure
            data[`q${i}`] = {
                sections: jsonData.sections.map(section => ({
                    title: section.model,
                    prompt: section.prompt,
                    hints: section.hint,
                    no_hands: section.no_hands || [],
                    hands_up: section.hands_up || []
                })),
                wrap_up: jsonData.wrap_up || []
            };
        } catch (error) {
            console.error(`Error loading ${filePath}:`, error.message);
        }
    }
    
    return data;
}

async function updateHtmlFile() {
    try {
        console.log('Loading JSON data...');
        
        // Load data from both directories
        const aiData = await loadJsonFiles(AI_DIR);
        const monetizationData = await loadJsonFiles(MONETIZATION_DIR);
        
        console.log('AI data loaded:', Object.keys(aiData));
        console.log('Monetization data loaded:', Object.keys(monetizationData));
        
        // Create the new embedded data structure
        const newEmbeddedData = {
            ai: aiData,
            monetization: monetizationData
        };
        
        // Read the HTML file
        console.log('Reading HTML file...');
        const htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
        
        // Find the embedded data section and replace it
        const dataStartPattern = /const embeddedData = {/;
        const dataEndPattern = /^        };$/m;
        
        const startMatch = htmlContent.match(dataStartPattern);
        if (!startMatch) {
            throw new Error('Could not find embedded data start pattern');
        }
        
        const startIndex = startMatch.index;
        const beforeData = htmlContent.substring(0, startIndex);
        
        // Find the end of the embedded data
        const afterStart = htmlContent.substring(startIndex);
        const endMatch = afterStart.match(dataEndPattern);
        if (!endMatch) {
            throw new Error('Could not find embedded data end pattern');
        }
        
        const endIndex = startIndex + endMatch.index + endMatch[0].length;
        const afterData = htmlContent.substring(endIndex);
        
        // Create the new embedded data string
        const newDataString = `const embeddedData = ${JSON.stringify(newEmbeddedData, null, 12)};`;
        
        // Combine everything
        const newHtmlContent = beforeData + newDataString + afterData;
        
        // Create backup
        const backupFile = HTML_FILE + '.backup';
        console.log(`Creating backup: ${backupFile}`);
        fs.writeFileSync(backupFile, htmlContent);
        
        // Write the updated HTML
        console.log('Writing updated HTML file...');
        fs.writeFileSync(HTML_FILE, newHtmlContent);
        
        console.log('✅ Successfully updated HTML with correct JSON data!');
        console.log(`📄 Backup created: ${backupFile}`);
        
    } catch (error) {
        console.error('❌ Error updating HTML file:', error.message);
        process.exit(1);
    }
}

// Run the script
updateHtmlFile();