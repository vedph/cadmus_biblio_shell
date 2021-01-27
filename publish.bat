@echo off
echo NPM PUBLISH
echo Before continuing, ensure that:
echo - you are logged in (npm whoami)
echo - you have successfully rebuilt all the libraries (npm run build-lib)
pause
cd .\dist\myrmidon\cadmus-biblio-api
call npm publish --access=public
cd ..\..\..
pause
cd .\dist\myrmidon\cadmus-biblio-core
call npm publish --access=public
cd ..\..\..
pause
cd .\dist\myrmidon\cadmus-biblio-ui
call npm publish --access=public
cd ..\..\..
pause
cd .\dist\myrmidon\cadmus-part-biblio-ui
call npm publish --access=public
cd ..\..\..
pause
cd .\dist\myrmidon\cadmus-part-biblio-pg
call npm publish --access=public
cd ..\..\..
pause
echo ALL DONE
