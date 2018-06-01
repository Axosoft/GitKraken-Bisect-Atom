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
  vendorDirectory: path.join(process.cwd(), 'vendor')
};

switch(process.platform){
  case 'win32':
    config.expectedChecksum = '77507cfc97cf52437422d061097aec9ec33a06c26431df4f4b2286cf413da9f4';
    config.source = url.parse(
      'https://github.com/stevek-axo/git-rs/releases/download/0.1.0/x86_64-pc-windows-msvc.tar.gz'
    );
    config.gitRsFile = 'x86_64-pc-windows-msvc.tar.gz';
    break;
  case 'linux':
    config.expectedChecksum = '21e3ca9ff5bd10fb91c6e2c59df3657921afbc5095b350161b015169e08d731b';
    config.source = url.parse(
      'https://github.com/stevek-axo/git-rs/releases/download/0.1.0/x86_64-unknown-linux-gnu.tar.gz'
    );
    config.gitRsFile = 'x86_64-unknown-linux-gnu.tar.gz';
    break;
  case 'darwin':
    config.expectedChecksum = 'c9036e36e23df3065b6842f17419d9417454f33fe6c87871141746284b1a7a85';
    config.source = url.parse(
      'https://github.com/stevek-axo/git-rs/releases/download/0.1.0/x86_64-apple-darwin.tar.gz'
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
