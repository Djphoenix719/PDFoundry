const fs = require('fs');
const path = require('path');

module.exports = async ({ context, github, tagName, releaseName, releaseMessage }) => {
    const {
        repo: { owner, repo },
        sha,
    } = context;

    const release = await github.repos.createRelease({
        owner,
        repo,
        name: releaseName,
        body: releaseMessage,
        tag_name: tagName,
        target_commitish: sha,
    });

    for (let file of fs.readdirSync('installers')) {
        console.log(`Uplaoding "${file}"`);
        await github.repos.uploadReleaseAsset({
            owner,
            repo,
            release_id: release.data.id,
            name: file,
            data: fs.readFileSync(path.resolve('installers', file)),
        });
    }
};
