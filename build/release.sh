set -e
echo "Enter release version: "
read VERSION

read -p "Releasing $VERSION - are you sure? (y/n)" -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Releasing $VERSION ..."
    export SAUCE_BUILD_ID=$VERSION:`date +"%s"`
    npm run lint
    # npm run flow
    # npm run test:cover
    # npm run test:e2e
    # npm run test:ssr
    # npm run test:sauce

    # Update version in package.json
    basePath=`realpath $(dirname ${BASH_SOURCE[0]})`
    json -I -f "$basePath/../package.json" -e "this.version='$VERSION'"
    # build
    VERSION=$VERSION npm run build:all
# echo 'git stuff prevented'
# exit 0
    # commit
    git add -A
    git commit -m "[build] $VERSION"
    # npm version $VERSION --message "[release] $VERSION"

    # publish
    git tag v$VERSION
    git push origin refs/tags/v$VERSION
    git push
    # npm publish
fi
