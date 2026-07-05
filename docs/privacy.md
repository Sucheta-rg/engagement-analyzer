# Privacy Notes

The MVP reads the active Google Doc only after the user clicks the analyze button and grants read-only Google Docs permission.

Document text is processed locally in the extension side panel. The MVP does not transmit document text to a developer server, sell user data, use user data for advertising, or train a model.

The extension requests the minimum scope needed for analysis:

`https://www.googleapis.com/auth/documents.readonly`
