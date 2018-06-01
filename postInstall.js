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

//Need to change config.source from Steve's fork to main fork
switch(process.platform){
    case 'win32':
        config.expectedChecksum = '77507cfc97cf52437422d061097aec9ec33a06c26431df4f4b2286cf413da9f4';
        config.source = url.parse(
            'https://github.com/stevek-axo/git-rs/releases/download/0.1.0/x86_64-pc-windows-msvc.tar.gz'
        );
        config.gitRsFile = 'x86_64-pc-windows-msvc.tar.g';
        break;
    case 'linux':
        config.expectedChecksum = '21e3ca9ff5bd10fb91c6e2c59df3657921afbc5095b350161b015169e08d731b';
        config.source = url.parse(
            'https://github.com/stevek-axo/git-rs/releases/download/0.1.0/x86_64-unknown-linux-gnu.tar.gz'
        );
        config.gitRsFile = 'x86_64-unknown-linux-gnu.tar.gz';
        break;
    case 'darwin':
        config.expectedChecksum = '9c5e372783d404ef49469370150c967efc3d31527f16ea08b5911f913c11b531';
        config.source = url.parse(
            'https://github.com/stevek-axo/git-rs/releases/download/0.1.0/x86_64-apple-darwin.tar.gz'
        );
        config.gitRsFile = 'x86_64-apple-darwin.tar.gz';
        break;
}

const getFileChecksum = async (filePath) => new Promise((resolve) => {
    checksum.file(filePath, { algorithm: 'sha256' } , (_, hash) => resolve(hash));
  });

const unpackFile = async (filePath, destinationPath) => tar.extract({
    cwd: destinationPath,
    file: filePath
  });

const setupGitRs = (config) => {
    const options = {
        url: config.source
    };
    const req = request.get(options);
    req.pipe(fs.createWriteStream(config.gitRsFile));

    req.on('error', (error) => {
        console.log('Failed to fetch gitrs');
        process.exit(1);
    });

    req.on('response', (res) => {
        if (res.statusCode !== 200) {
            console.log(`Non-200 response returned from ${config.source.toString()} - (${res.statusCode})`);
            process.exit(1);
        }
    })

    req.on('end', async () => {
        const checksum = await getFileChecksum(config.gitRsFile, config);
        if (checksum != config.expectedChecksum) {
            console.log('Checksum validation failed');
            process.exit(1);
        }

        mkdirp(config.vendorDirectory, (error) => {
            if (error) {
              console.log('Could not create vendor directory');
              process.exit(1);
            }
        });

        try {
            await unpackFile(path.join(process.cwd(), config.gitRsFile), config.vendorDirectory);
        } catch (error) {
            console.log('Could not extract gitrs archive');
            process.exit(1);
        }

        fs.unlink(config.gitRsFile, (error) => {
            if (error) {
                console.log('Could not delete gitrs tar file');
                process.exit(1);
            }
        });
    });
}

setupGitRs(config);

