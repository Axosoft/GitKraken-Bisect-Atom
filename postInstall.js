const checksum = require('checksum');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const request = require('request');
const tar = require('tar');
const url = require('url');

const config = {
  expectedChecksum: '',
  source: '',
  gitRsFile: '',
  vendorDirectory: path.join(process.cwd(), 'vendor','gitrs')
};

switch(process.platform){
  case 'win32':
    config.expectedChecksum = 'c376e6cfb542a268534b772d640baa747871c5c4ac570428147cf2bca7e2ee47';
    config.source = url.parse(
      'https://github.com/Axosoft/git-rs/releases/download/0.1.0/x86_64-pc-windows-msvc.tar.gz'
    );
    config.gitRsFile = 'x86_64-pc-windows-msvc.tar.gz';
    break;
  case 'linux':
    config.expectedChecksum = 'b044816ef6fa6a1ce64737eddd011129926a9139e9e3a5a27c844b37300e9730';
    config.source = url.parse(
      'https://github.com/Axosoft/git-rs/releases/download/0.1.0/x86_64-unknown-linux-gnu.tar.gz'
    );
    config.gitRsFile = 'x86_64-unknown-linux-gnu.tar.gz';
    break;
  case 'darwin':
    config.expectedChecksum = '104c1b4ebf8205361ee1af34830117ecc5c20bf98c66533dbe67bd1f51eacd85';
    config.source = url.parse(
      'https://github.com/Axosoft/git-rs/releases/download/0.1.0/x86_64-apple-darwin.tar.gz'
    );
    config.gitRsFile = 'x86_64-apple-darwin.tar.gz';
    break;
}

const getFileChecksum = (filePath) => new Promise((resolve) => {
  checksum.file(filePath, { algorithm: 'sha256' } , (_, hash) => resolve(hash));
});

const unpackFile = (filePath, destinationPath) => tar.extract({
  cwd: destinationPath,
  file: filePath
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
      mkdirp(config.vendorDirectory, (error) => {
        if (error) {
          return Promise.reject(Error('Could not create vendor directory'));
        }
      });
      return Promise.resolve();
    })
    .then(() => unpackFile(path.join(process.cwd(), config.gitRsFile), config.vendorDirectory))
    .then(() => {
      fs.unlink(config.gitRsFile, (error) => {
        if (error) {
          return Promise.reject(Error('Could not delete gitrs tar file'));
        }
      });
    })
    .catch((error) => {
      console.log(error); // eslint-disable-line no-console
    });
};

setupGitRs(config);
