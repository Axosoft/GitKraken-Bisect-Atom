const checksum = require('checksum');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const request = require('request');
const tar = require('tar');
const url = require('url');
const zip = require('cross-zip');

const config = {
  expectedChecksum: '',
  source: '',
  gitRsFile: '',
  vendorDirectory: path.join(process.cwd(), 'vendor')
};

switch(process.platform){
  case 'win32':
    config.expectedChecksum = 'bf39b8538db936a1889efefdbd299a6a6cf93ecaf0de012aad7c1b50d53e9108';
    config.source = url.parse(
      'https://github.com/implausible/git-rs/releases/download/0.1.2/x86_64-pc-windows-msvc.zip'
    );
    config.gitRsFile = 'x86_64-pc-windows-msvc';
    break;
  case 'linux':
    config.expectedChecksum = '0234e8da165f4d8a3fd91f250c61f09bd1e010a1a6a45a9f287c73b9471a4394';
    config.source = url.parse(
      'https://github.com/implausible/git-rs/releases/download/0.1.2/x86_64-unknown-linux-gnu.zip'
    );
    config.gitRsFile = 'x86_64-unknown-linux-gnu';
    break;
  case 'darwin':
    config.expectedChecksum = 'd4b2dc8d7e4135e7721c870a3dd751add892071e11ec5ff4f1b5b9d3d6f4ea6a';
    config.source = url.parse(
      'https://github.com/implausible/git-rs/releases/download/0.1.2/x86_64-apple-darwin.zip'
    );
    config.gitRsFile = 'x86_64-apple-darwin';
    break;
}

const getFileChecksum = (filePath) => new Promise((resolve) => {
  checksum.file(filePath, { algorithm: 'sha256' } , (_, hash) => resolve(hash));
});

const unpackFile = (filePath, destinationPath) => zip.unzip({
  cwd: destinationPath,
  file: filePath,
});

const setupGitRs = (config) => {
  new Promise( (resolve, reject) => {
    const req = request.get({ url: config.source });
    req.pipe(fs.createWriteStream(config.gitRsFile));

    req.on('error', () => {
      reject(Error('Failed to fetch gitrs'));
    });

    req.on('response', (res) => {
      if (res.statusCode !== 200) {
        reject(Error('Non-200 response returned from ${config.source.toString()} - (${res.statusCode})'));
      }
    });

    req.on('end', () => resolve());
  })
    .then(() => getFileChecksum(config.gitRsFile, config))
    .then((checksum) => {
      if (checksum != config.expectedChecksum) {
        return Promise.reject(Error('Checksum validation failed'));
      }
      return Promise.resolve();
    })
    .then(() => {
      console.log('making directory')
      return new Promise((resolve, reject) => mkdirp(
        config.vendorDirectory,
        (error) => error ? reject(new Error('Could not create vendor directory')) : resolve()
      ));
    })
    .then(() => {
      console.log(path.join(__dirname, '..', config.gitRsFile));
      console.log(config.vendorDirectory)
      return new Promise((resolve, reject) =>
        zip.unzip(
          path.join(__dirname, '..', config.gitRsFile),
          config.vendorDirectory,
          error => error ? reject(new Error('Could not unzip gitRs archive')) : resolve()
        )
      );
      console.log('File unzipped');
    })
    .then(() => {
      console.log(path.join(__dirname, config.gitRsFile));
      return new Promise((resolve, reject) => fs.unlink(
        path.join(__dirname, '..', config.gitRsFile),
        (error) => error ? reject('Could not delete git-rs zip file') : resolve()
      ));
    })
    .catch((error) => {
      console.log(error);
    });
};

setupGitRs(config);
