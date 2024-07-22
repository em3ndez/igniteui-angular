import { Injectable, SecurityContext, Inject, Optional } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { DOCUMENT } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { PlatformUtil } from "../core/utils";

export type IconType = "svg" | "font" | "liga";

export interface IconMeta {
    name: string;
    family: string;
    type?: IconType;
}

interface FamilyMeta {
    className: string;
    type: IconType;
    prefix?: string;
}

export interface IconFamily {
    name: string;
    meta: FamilyMeta;
}

export type IconReference = IconMeta & FamilyMeta;

/**
 * Event emitted when a SVG icon is loaded through
 * a HTTP request.
 */
export interface IgxIconLoadedEvent {
    /** Name of the icon */
    name: string;
    /** The actual SVG text, if any */
    value?: string;
    /** The font-family for the icon. Defaults to material. */
    family: string;
}

/**
 * **Ignite UI for Angular Icon Service** -
 *
 * The Ignite UI Icon Service makes it easy for developers to include custom SVG images and use them with IgxIconComponent.
 * In addition it could be used to associate a custom class to be applied on IgxIconComponent according to given font-family.
 *
 * Example:
 * ```typescript
 * this.iconService.setFamily('material', { className: 'material-icons', type: 'font' });
 * this.iconService.addSvgIcon('aruba', '/assets/svg/country_flags/aruba.svg', 'svg-flags');
 * ```
 */
@Injectable({
    providedIn: "root",
})
export class IgxIconService {
    /**
     * Observable that emits when an icon is successfully loaded
     * through a HTTP request.
     *
     * @example
     * ```typescript
     * this.service.iconLoaded.subscribe((ev: IgxIconLoadedEvent) => ...);
     * ```
     */
    public iconLoaded: Observable<IgxIconLoadedEvent>;

    private _defaultFamily: IconFamily = {
        name: "material",
        meta: { className: "material-icons", type: "liga" },
    };
    private _iconRefs = new Map<string, Map<string, IconMeta>>();
    private _families = new Map<string, FamilyMeta>();
    private _cachedIcons = new Map<string, Map<string, SafeHtml>>();
    private _iconLoaded = new Subject<IgxIconLoadedEvent>();
    private _domParser: DOMParser;

    constructor(
        @Optional() private _sanitizer: DomSanitizer,
        @Optional() private _httpClient: HttpClient,
        @Optional() private _platformUtil: PlatformUtil,
        @Optional() @Inject(DOCUMENT) protected document: Document,
    ) {
        this.iconLoaded = this._iconLoaded.asObservable();
        this.setFamily(this._defaultFamily.name, this._defaultFamily.meta);

        if (this._platformUtil?.isBrowser) {
            this._domParser = new DOMParser();
        }
    }

    /**
     *  Returns the default font-family.
     * ```typescript
     *   const defaultFamily = this.iconService.defaultFamily;
     * ```
     */
    public get defaultFamily(): IconFamily {
        return this._defaultFamily;
    }

    /**
     *  Sets the default font-family.
     * ```typescript
     *   this.iconService.defaultFamily = 'svg-flags';
     * ```
     */
    public set defaultFamily(family: IconFamily) {
        this._defaultFamily = family;
        this.setFamily(this._defaultFamily.name, this._defaultFamily.meta);
    }

    /**
     *  Registers a custom class to be applied to IgxIconComponent for a given font-family.
     * ```typescript
     *   this.iconService.registerFamilyAlias('material', 'material-icons');
     * ```
     * @deprecated Use `setFamily` instead.
     */
    public registerFamilyAlias(
        alias: string,
        className: string = alias,
        type: IconType = "font",
    ): this {
        this.setFamily(alias, { className, type });
        return this;
    }

    /**
     *  Returns the custom class, if any, associated to a given font-family.
     * ```typescript
     *   const familyClass = this.iconService.familyClassName('material');
     * ```
     */
    public familyClassName(alias: string): string {
        return this._families.get(alias)?.className || alias;
    }

    /** @hidden @internal */
    private familyType(alias: string): IconType {
        return this._families.get(alias)?.type;
    }

    /**
     *  Creates a family to className relationship that is applied to the IgxIconComponent
     *   whenever that family name is used.
     * ```typescript
     *   this.iconService.setFamily('material', { className: 'material-icons', type: 'liga' });
     * ```
     */
    public setFamily(name: string, meta: FamilyMeta) {
        this._families.set(name, meta);
    }

    /**
     *  Adds an icon reference meta for an icon in a meta family.
     *  Executes only if no icon reference is found.
     * ```typescript
     *   this.iconService.addIconRef('aruba', 'default', { name: 'aruba', family: 'svg-flags' });
     * ```
     */
    public addIconRef(name: string, family: string, icon: IconMeta) {
        const iconRef = this._iconRefs.get(family)?.get(name);

        if (!iconRef) {
            this.setIconRef(name, family, icon);
        }
    }

    /**
     *  Similar to addIconRef, but always sets the icon reference meta for an icon in a meta family.
     * ```typescript
     *   this.iconService.setIconRef('aruba', 'default', { name: 'aruba', family: 'svg-flags' });
     * ```
     */
    public setIconRef(name: string, family: string, icon: IconMeta) {
        let familyRef = this._iconRefs.get(family);

        if (!familyRef) {
            familyRef = new Map<string, IconMeta>();
            this._iconRefs.set(family, familyRef);
        }

        const familyType = this.familyType(icon?.family);
        familyRef.set(name, { ...icon, type: icon.type ?? familyType });

        this._iconLoaded.next({ name, family });
    }

    /**
     *  Returns the icon reference meta for an icon in a given family.
     * ```typescript
     *   const iconRef = this.iconService.getIconRef('aruba', 'default');
     * ```
     */
    public getIconRef(name: string, family: string): IconReference {
        const icon = this._iconRefs.get(family)?.get(name);

        const iconFamily = icon?.family ?? family;
        const _name = icon?.name ?? name;
        const type = icon?.type ?? this.familyType(iconFamily);
        const className = this.familyClassName(iconFamily);
        const prefix = this._families.get(iconFamily)?.prefix;

        // Handle name prefixes
        let iconName = _name;

        if (iconName && prefix) {
            iconName = _name.includes(prefix) ? _name : `${prefix}${_name}`;
        }

        return {
            className,
            type,
            name: iconName,
            family: iconFamily,
        };
    }

    /**
     *  Adds an SVG image to the cache. SVG source is an url.
     * ```typescript
     *   this.iconService.addSvgIcon('aruba', '/assets/svg/country_flags/aruba.svg', 'svg-flags');
     * ```
     */
    public addSvgIcon(
        name: string,
        url: string,
        family = this._defaultFamily.name,
        stripMeta = false,
    ) {
        if (name && url) {
            const safeUrl = this._sanitizer.bypassSecurityTrustResourceUrl(url);
            if (!safeUrl) {
                throw new Error(
                    `The provided URL could not be processed as trusted resource URL by Angular's DomSanitizer: "${url}".`,
                );
            }

            const sanitizedUrl = this._sanitizer.sanitize(
                SecurityContext.RESOURCE_URL,
                safeUrl,
            );
            if (!sanitizedUrl) {
                throw new Error(
                    `The URL provided was not trusted as a resource URL: "${url}".`,
                );
            }

            if (!this.isSvgIconCached(name, family)) {
                this._families.set(family, { className: family, type: "svg" });

                this.fetchSvg(url).subscribe((res) => {
                    this.cacheSvgIcon(name, res, family, stripMeta);
                });
            }
        } else {
            throw new Error(
                "You should provide at least `name` and `url` to register an svg icon.",
            );
        }
    }

    /**
     *  Adds an SVG image to the cache. SVG source is its text.
     * ```typescript
     *   this.iconService.addSvgIconFromText('simple', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
     *   <path d="M74 74h54v54H74" /></svg>', 'svg-flags');
     * ```
     */
    public addSvgIconFromText(
        name: string,
        iconText: string,
        family = "",
        stripMeta = false,
    ) {
        if (name && iconText) {
            if (this.isSvgIconCached(name, family)) {
                return;
            }

            this._families.set(family, { className: family, type: "svg" });
            this.cacheSvgIcon(name, iconText, family, stripMeta);
        } else {
            throw new Error(
                "You should provide at least `name` and `iconText` to register an svg icon.",
            );
        }
    }

    /**
     *  Returns whether a given SVG image is present in the cache.
     * ```typescript
     *   const isSvgCached = this.iconService.isSvgIconCached('aruba', 'svg-flags');
     * ```
     */
    public isSvgIconCached(name: string, family = ""): boolean {
        const familyClassName = this.familyClassName(family);
        if (this._cachedIcons.has(familyClassName)) {
            const familyRegistry = this._cachedIcons.get(
                familyClassName,
            ) as Map<string, SafeHtml>;
            return familyRegistry.has(name);
        }

        return false;
    }

    /**
     *  Returns the cached SVG image as string.
     * ```typescript
     *   const svgIcon = this.iconService.getSvgIcon('aruba', 'svg-flags');
     * ```
     */
    public getSvgIcon(name: string, family = "") {
        const familyClassName = this.familyClassName(family);
        return this._cachedIcons.get(familyClassName)?.get(name);
    }

    /**
     * @hidden
     */
    private fetchSvg(url: string): Observable<string> {
        const req = this._httpClient.get(url, { responseType: "text" });
        return req;
    }

    /**
     * @hidden
     */
    private cacheSvgIcon(
        name: string,
        value: string,
        family = this._defaultFamily.name,
        stripMeta: boolean,
    ) {
        family = family ? family : this._defaultFamily.name;

        if (this._platformUtil?.isBrowser && name && value) {
            const doc = this._domParser.parseFromString(value, "image/svg+xml");
            const svg = doc.querySelector("svg") as SVGElement;

            if (!this._cachedIcons.has(family)) {
                this._cachedIcons.set(family, new Map<string, SafeHtml>());
                this._iconLoaded.next({ name, value, family });
            }

            if (svg) {
                svg.setAttribute("fit", "");
                svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

                if (stripMeta) {
                    const title = svg.querySelector("title");
                    const desc = svg.querySelector("desc");

                    if (title) {
                        svg.removeChild(title);
                    }

                    if (desc) {
                        svg.removeChild(desc);
                    }
                }

                const safeSvg = this._sanitizer.bypassSecurityTrustHtml(
                    svg.outerHTML,
                );
                this._cachedIcons.get(family).set(name, safeSvg);
            }
        }
    }
}
