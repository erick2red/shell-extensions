EXTENSION_ID = wish-list

include ../../extension.mk

EXTRA_DIST = lists.json
extension_DATA = lists.json

install-data-hook:
	chmod auo+rw $(extensiondir)/lists.json

@INTLTOOL_XML_NOMERGE_RULE@

