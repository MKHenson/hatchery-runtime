declare namespace HatcheryRuntime {

    export namespace Events {

        export interface IAssetEvent { asset : Asset }
        export interface IContainerEvent { container : Container }
        export interface IMessageEvent { message : string }
        export interface IRuntimeEvent { container : Container, percentage: number }

        /**
         * Describes asset related events
         */
        type AssetEvents = 'asset-loaded';

        /**
         * Describes container related events
         */
        type ContainerEvents = 'container-loaded';

        /**
         * Describes events sent by the messenger
         */
        type MessengerEvents = 'on-message';

        /**
         * Describes events sent by the runtime
         */
        type RuntimeEvents = 'load-progress';
    }

    /**
     * Describes a portal's function
     */
    export type PortalType = 'input' | 'output' | 'parameter' | 'product';

    /**
     * Describes the item type
     */
    export type ItemType = 'behaviour' | 'link' | 'asset' | 'portal' | 'script' | 'instance';

    /**
     * Describes the types of objects we can interact with from a scene
     */
    export type DataType = 'asset' | 'number' | 'group' | 'file' | 'string' | 'any' | 'bool' | 'int' | 'color' | 'enum' | 'hidden';

    /**
     * A basic wrapper for a Portal interface
     */
    export interface IPortal {
        name: string;
        type: PortalType;
        custom: boolean;
        valueType: DataType;
        value: any;
    }

    /**
     * A basic wrapper for a CanvasItem interface
     */
    export interface ICanvasItem {
        id?: number;
        type?: ItemType;
    }

    /**
     * A basic wrapper for a Link interface
     */
    export interface ILinkItem extends ICanvasItem {
        frameDelay: number;
        startPortal: string;
        endPortal: string;
        startBehaviour: number;
        endBehaviour: number;
    }

    /**
     * A basic wrapper for a Behaviour interface
     */
    export interface IBehaviour extends ICanvasItem {
        alias: string;
        behaviourType: string;
        portals: IPortal[];
    }

    /**
     * A basic wrapper for a BehaviourPortal interface
     */
    export interface IBehaviourPortal extends IBehaviour {
        portal: IPortal;
    }

    /**
     * A basic wrapper for a BehaviourScript interface
     */
    export interface IBehaviourScript extends IBehaviour {
        scriptId: string;
    }

    /**
     * A basic wrapper for a BehaviourShortcut interface
     */
    export interface IBehaviourShortcut extends IBehaviour {
        originalId: number;
    }

    /**
     * A basic wrapper for a behaviour instances
     */
    export interface IBehaviourInstance extends IBehaviour {
        containerId: number;
    }

    /**
     * An interface to describe the container behaviour structure
     */
    export interface IContainer extends IBehaviour {
        name: string;
		behaviours: IBehaviour[];
		links: ILinkItem[];
		assets: number[];
		groups: number[];
		properties: {};
		plugins: {};
    }

    /**
     * Describes a runtime asset
     */
	export interface IAsset {
		name: string;
		shallowId: number;
		properties: { [name: string]: any };
		className: string;
		assets: number[];
	}

    /**
     * Describes a runtime group
     */
    export interface IGroup {
        name: string;
		shallowId: number;
        items: number[];
	}

    /**
     * Describes a runtime scene
     */
	export interface IScene {
		assets: IAsset[];
		groups: IGroup[];
		containers: IContainer[];
		converters: {};
		data: {};
	}
}