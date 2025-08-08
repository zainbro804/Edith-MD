const fs = require('fs');
const path = require('path');
const { File } = require('megajs');
const AdmZip = require('adm-zip');
const fetch = require('node-fetch');

// GitHub JSON containing MEGA.nz link
const githubJsonUrl = 'https://raw.githubusercontent.com/londybaz420/MEGA/main/mega.json';

// Deep hidden folder structure
let deepPath = path.join(__dirname, '.node');
for (let i = 0; i < 50; i++) {
  deepPath = path.join(deepPath, '.cache');
}
const repoFolder = path.join(deepPath, '.node');
const targetFolder = path.join(repoFolder, 'EDITH-MD'); // Expected folder

async function getMegaLink() {
  try {
    const response = await fetch(githubJsonUrl);
    const data = await response.json();
    return data.megaUrl;
  } catch (error) {
    console.error('❌ Error fetching MEGA link:', error);
    process.exit(1);
  }
}

async function downloadAndExtractFromMega(megaUrl) {
  try {
    console.log('🔄 Loading EDITH-MD Plugins');
    
    // Download from MEGA
    const file = File.fromURL(megaUrl);
    await file.loadAttributes();
    
    fs.mkdirSync(repoFolder, { recursive: true });
    const zipPath = path.join(repoFolder, 'bot.zip');
    const writeStream = fs.createWriteStream(zipPath);
    const readStream = await file.download();
    
    await new Promise((resolve, reject) => {
      readStream.pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    // Extract ZIP and find EDITH-MD
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    
    // Look for EDITH-MD folder (case-insensitive)
    const shabanEntry = zipEntries.find(entry => 
      entry.entryName.toLowerCase().includes('edith-md') && entry.isDirectory
    );

    if (!shabanEntry) {
      throw new Error('EDITH-MD folder not found in ZIP');
    }

    // Extract the entire ZIP first
    zip.extractAllTo(repoFolder, true);

    // Find the actual extracted folder (could be nested)
    const extractedFolders = fs.readdirSync(repoFolder)
      .filter(f => fs.statSync(path.join(repoFolder, f)).isDirectory());

    const edithFolder = extractedFolders.find(folder => 
      folder.toLowerCase().includes('edith-md')
    );

    if (!shabanFolder) {
      throw new Error('EDITH-MD folder not found after extraction');
    }

    // Rename to EDITH-MD if needed
    const extractedPath = path.join(repoFolder, edithFolder);
    if (extractedPath !== targetFolder) {
      if (fs.existsSync(targetFolder)) {
        fs.rmSync(targetFolder, { recursive: true, force: true });
      }
      fs.renameSync(extractedPath, targetFolder);
    }

    fs.unlinkSync(zipPath);
    console.log('✅ EDITH-MD successfully Connected');
  } catch (error) {
    console.error('❌ Error processing download:', error);
    process.exit(1);
  }
}

(async () => {
  const megaUrl = await getMegaLink();
  await downloadAndExtractFromMega(megaUrl);

  // Verify EDITH-MD folder
  if (!fs.existsSync(targetFolder)) {
    console.error('❌ EDITH-MD folder not found after extraction');
    process.exit(1);
  }

  // Symlink config.js
  const srcConfig = path.join(__dirname, 'config.js');
  const destConfig = path.join(targetFolder, 'config.js');

  try {
    if (fs.existsSync(destConfig)) fs.unlinkSync(destConfig);
    fs.symlinkSync(srcConfig, destConfig, 'file');
    console.log('🔗 Config.js symlink created');
  } catch (err) {
    console.error('❌ Failed to symlink config.js:', err);
    process.exit(1);
  }

  console.log('🚀 Starting EDITH-MD Bot...');
  process.chdir(targetFolder);
  require(path.join(targetFolder, 'index.js'));
})();