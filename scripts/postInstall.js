const checksum = require('checksum');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const request = require('request');
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
    config.expectedChecksum = '8544d72f846e9f2c4230570963ad7ada30a127e4c4d8b3405f568ae0cbb4132c';
    config.source = url.parse(
      'https://github.com/Axosoft/git-rs/releases/download/0.1.1/x86_64-pc-windows-msvc.zip'
    );
    config.gitRsFile = 'x86_64-pc-windows-msvc';
    // The windows version does not extract a `git-rs` folder like the other platforms do.
    config.vendorDirectory = path.join(config.vendorDirectory, 'git-rs');
    break;
  case 'linux':
    config.expectedChecksum = 'fa70f1535b7e9a622f1388378ee0bb2c10b8c7e466163cef900c251684dc571e';
    config.source = url.parse(
      'https://github.com/Axosoft/git-rs/releases/download/0.1.1/x86_64-unknown-linux-gnu.zip'
    );
    config.gitRsFile = 'x86_64-unknown-linux-gnu';
    break;
  case 'darwin':
    config.expectedChecksum = '29b5a26976928321ec5a4096d7158c9be43976cec2757fb6eb43449d46265a4f';
    config.source = url.parse(
      'https://github.com/Axosoft/git-rs/releases/download/0.1.1/x86_64-apple-darwin.zip'
    );
    config.gitRsFile = 'x86_64-apple-darwin';
    break;
}

const getFileChecksum = (filePath) => new Promise((resolve) => {
  checksum.file(filePath, { algorithm: 'sha256' } , (_, hash) => resolve(hash));
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
      return new Promise((resolve, reject) => mkdirp(
        config.vendorDirectory,
        (error) => error ? reject(new Error('Could not create vendor directory')) : resolve()
      ));
    })
    .then(() => {
      return new Promise((resolve, reject) =>
        zip.unzip(
          path.join(__dirname, '..', config.gitRsFile),
          config.vendorDirectory,
          error => error ? reject(new Error('Could not unzip gitRs archive')) : resolve()
        )
      );
    })
    .then(() => {
      return new Promise((resolve, reject) => fs.unlink(
        path.join(__dirname, '..', config.gitRsFile),
        (error) => error ? reject('Could not delete git-rs zip file') : resolve()
      ));
    })
    .catch((error) => {
      console.log(error); // eslint-disable-line no-console
    });
};

setupGitRs(config);
