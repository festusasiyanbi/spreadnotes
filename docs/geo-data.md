# Geography reference data

`public/geo/` contains a compact local copy of the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database) by dr5hn, retrieved at source revision `6bf749104a7abba57b9307410599edf4786f792e`. The source is licensed under the Open Database License; the license copy is at `public/geo/license.txt`. Attribute the source when using the data in the interface.

The bundle has one country index and one state/city chunk per country. The browser loads the country index first, then only the selected country's chunk. No external geography service is called during the workflow.

These records are geographic reference names and identifiers. They are not Meta, LinkedIn, or TikTok targeting identifiers. Account, objective, country, and platform rules may make a place unavailable for advertising; actual API adapters must verify and resolve every selection before submission. Recheck source updates and the license before redistributing or altering this bundle.
