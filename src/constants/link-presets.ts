import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { LinkPreset, type NavBarLink } from "@/types/config";

export const LinkPresets: { [key in LinkPreset]: NavBarLink } = {
 	[LinkPreset.About]: {
		name: i18n(I18nKey.about),
		url: "/",
	},
	[LinkPreset.Writeup]: {
		name: i18n(I18nKey.writeups),
		url: "/writeups/",
	},
	[LinkPreset.Archive]: {
		name: i18n(I18nKey.archive),
		url: "/archive/",
	},
	[LinkPreset.Team]: {
		name: i18n(I18nKey.team),
		url: "/team/",
	},
};
