const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const results = [];

fs.createReadStream(path.resolve(__dirname, 'ATTENDANCE SHEET.csv'))
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log(results);
    // You can now work with the CSV data as a JavaScript array of objects
  });
