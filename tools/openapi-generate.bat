@echo off
setlocal
rem Default to swagger json endpoint actually exposed by setupSwagger
if "%OAPI_URL%"=="" set OAPI_URL=http://localhost:3000/api/docs-json
echo [openapi] Fetching %%OAPI_URL%%...
rem Generate a .ts file (not .d.ts) so we can import and re-export cleanly.
npx openapi-typescript "%OAPI_URL%" --output-format ts -o libs/shared/api-types/openapi.ts
if errorlevel 1 (
	echo [openapi] Generation failed.
) else (
	echo [openapi] Types generated at libs/shared/api-types/openapi.ts
)
endlocal
