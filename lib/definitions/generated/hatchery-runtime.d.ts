declare module HatcheryRuntime {

    /**
     * Describes a portal's function
     */
    export type PortalType = 'input' | 'output' | 'parameter' | 'product';

    /**
     * Describes the item type
     */
    export type ItemType = 'behaviour' | 'link' | 'asset' | 'shortcut' | 'portal' | 'script' | 'comment' | 'instance';

    /**
     * A basic wrapper for a Portal interface
     */
    export interface IPortal {
        name: string;
        type: PortalType;
        custom: boolean;
        property: any;
        left?: number;
        top?: number;
    }

    /**
     * A basic wrapper for a CanvasItem interface
     */
    export interface ICanvasItem {
        id?: number;
        type?: ItemType;
        left?: number;
        top?: number;
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
        portals?: Array<IPortal>;
    }

    /**
    * A basic wrapper for a Comment interface
    */
    export interface IComment extends ICanvasItem {
        label: string;
        width : number;
        height : number;
    }

    /**
    * A basic wrapper for a BehaviourPortal interface
    */
    export interface IBehaviourPortal extends IBehaviour {
        portal: IPortal;
    }

    /**
    * A basic wrapper for a BehaviourComment interface
    */
    export interface IBehaviourComment extends IBehaviour {
        width: number;
        height: number;
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
}