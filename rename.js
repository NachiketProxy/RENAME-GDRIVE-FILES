const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const KEYFILEPATH = 'credentials.json'; // Ensure this path is correct

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function getFilesInFolder(folderId) {
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='image/png'`,
      fields: 'files(id, name)',
    });
    return res.data.files;
  } catch (error) {
    console.error('Error fetching files:', error);
    throw error;
  }
}

async function renameFileInGoogleDrive(fileId, newName) {
  try {
    await drive.files.update({
      fileId: fileId,
      requestBody: { name: newName },
    });
    console.log(`Renamed file ID ${fileId} to ${newName}`);
  } catch (error) {
    console.error(`Error renaming file ID ${fileId}:`, error);
  }
}

function extractDataFromFileName(fileName) {
  const parts = fileName.split('.');
  const fileNumber = parts[0];
  return {
    fileNumber
  };
}

function processCSVData() {
  return new Promise((resolve, reject) => {
    const data = [];
    fs.createReadStream('ATTENDANCE SHEET.csv')
      .pipe(csv())
      .on('data', (row) => data.push(row))
      .on('end', () => resolve(data))
      .on('error', (error) => reject(error));
  });
}

function renameFiles(files, data) {
  files.forEach(file => {
    const { fileNumber } = extractDataFromFileName(file.name);
    const matchingData = data.find(row => row['ROLL NO.'] === fileNumber);

    if (matchingData) {
      const newFileName = `${fileNumber}.${matchingData['NAME']}.png`;
      renameFileInGoogleDrive(file.id, newFileName);
    } else {
      console.log(`No matching data found for file: ${file.name}`);
    }
  });
}

async function main() {
  const folderId = '1x35CYKGhj0GG_76Mw7VIdTnz3-pSUuwd'; // Replace with your folder ID

  try {
    const files = await getFilesInFolder(folderId);
    const data = await processCSVData();
    renameFiles(files, data);
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main();
