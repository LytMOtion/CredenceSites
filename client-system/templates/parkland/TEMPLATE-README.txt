CREDENCE PROTECTED TEMPLATE — parkland
================================
This is an INDEPENDENT, FROZEN source package used only to GENERATE new client
websites. It is derived from the approved public demonstration at /parkland but is a
separate copy.

DO NOT EDIT A MASTER DEMONSTRATION WHILE CREATING A CLIENT SITE.
A client build only READS these template files and WRITES to a separate output
folder (client-work/<slug> validated input -> generated-clients/<slug> or an
external --output path). It never writes back into this template or into
/parkland, /coastal, /parkland, /desert, or the Credence root.

To intentionally improve this template for FUTURE clients, edit here and bump
the templateVersion in client-system/templates/_meta.json. Existing generated
client sites are not touched automatically (see docs/CLAUDE-WORKFLOW.md).
