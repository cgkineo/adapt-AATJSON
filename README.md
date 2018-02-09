# adapt-AATJSON  
Adapt Framework pre-filter for correcting Adapt Authoring Tool JSON

1. trims whitespace 
2. removes carriage returns `\n`
3. checks for and removes a singular wrapping `p` tag
4. revert html escaping
5. trims whitespace (again)
