namespace HatcheryRuntime {

    /**
     * The loader class is used to load an Animate export and prepare a {Runtime} environment
     */
    export class Loader extends EventDispatcher {

        constructor() {
            super();
        }

        /**
         * This function will loop through each object factory and try to create animate items based on their type.
         * @param {any} data
         * @param {Runtime} runtime The runtime we are loading
         * @returns {Behaviour}
         */
        createBehaviour( data: any, runtime: Runtime ): Behaviour {
            const factories = Runtime.behaviourFactories;
            let toRet: Behaviour = null;
            for ( const factory of factories ) {
                toRet = factory.create( data, runtime );
                if ( toRet )
                    return toRet;
            }

            return toRet;
        }

        /**
         * This function will loop through each object factory and try to create animate items based on their type.
         * @param {IAsset} assetData The asset data to use in determining what kind of asset to load
         * @param {Runtime} runtime The runtime we are loading
         * @returns {Asset}
         */
        createAsset( assetData: IAsset, runtime: Runtime ): Asset {

            let toRet: Asset = null;
            const factories = Runtime.assetFactories;

            for ( const factory of factories ) {
                toRet = factory.create( assetData, runtime );
                if ( toRet )
                    break;
            }

            if ( toRet === null ) {
                toRet = new Asset( runtime );
                toRet.noLoading = true;
            }

            toRet.shallowId = assetData.shallowId;
            toRet.name = assetData.name;
            toRet.className = assetData.className;
            toRet.properties = assetData.properties;
            return toRet;
        }

        /**
         * This function is called when a behaviour is double clicked,
         * a canvas is created and we try and load the behavious contents.
         * @param {IScene} data The scene object we are loading
         * @returns {Runtime}
         */
        open( data: IScene ) {
            let allLinks: ILinkItem[] = [];
            const toRet: Runtime = new Runtime();

            // Create the assets and groups
            if ( data ) {

                for ( let i = 0, l = data.assets.length; i < l; i++ )
                    toRet.assets.push( this.createAsset( data.assets[ i ], toRet ) );

                for ( let i = 0, l = data.groups.length; i < l; i++ ) {
                    const groupData = data.groups[ i ];
                    const group: Group = new Group( toRet );
                    group.runtime = toRet;
                    group.name = groupData.name;
                    group.shallowId = groupData.shallowId;
                    toRet.groups.push( group );

                    ( <any>group )._items = groupData.items;
                }

                for ( const group of toRet.groups ) {

                    // Associate the assets & groups
                    if ( ( <any>group )._items ) {

                        let i: number = ( <any>group )._items.length;
                        while ( i-- ) {
                            const asset: Asset = toRet.getAsset(( <any>group )._items[ i ].toString() )
                            if ( asset ) {
                                group.assets.push( asset );
                                asset.containerRefCount++;
                            }
                            // Not an asset - might be a group
                            else {
                                let giii = toRet.groups.length;
                                while ( giii-- )
                                    if ( toRet.groups[ giii ].shallowId.toString() === ( <any>group )._items[ i ].toString() ) {
                                        group.assets.push( toRet.groups[ giii ] );
                                        toRet.groups[ giii ].containerRefCount++;
                                    }
                            }
                        }
                    }

                    ( <any>group )._items = null;
                }

            }

            // Now do the containers
            for ( const containerData of data.containers ) {
                const container: Container = new Container( toRet );
                toRet.containers.push( container );

                container.id = containerData.id;
                container.alias = containerData.name;
                container.properties = containerData.properties;
                container.plugins = containerData.plugins;
                container.unloadOnExit = container.properties[ 'Unload On Exit' ];

                let item: Behaviour = null;
                const behaviours = containerData.behaviours;

                // Create each of the behaviours
                for ( const behaviourData of behaviours ) {

                    // If its a behaviour portal, then add the portal to the container
                    if ( behaviourData.type === 'portal' ) {
                        let portalBehaviour = behaviourData as IBehaviourPortal;
                        container.addPortal( portalBehaviour.portal.type, portalBehaviour.portal.name, portalBehaviour.portal.value, portalBehaviour.portal.valueType );
                        continue;
                    }
                    else
                        item = this.createBehaviour( behaviourData, toRet );

                    // Check if it was created ok
                    if ( item !== null ) {
                        container.behaviours.push( item );
                        item.id = behaviourData.id;
                        item.alias = behaviourData.alias;
                        item.container = container;

                        // Add the portals if they exist
                        if ( behaviourData.portals ) {
                            for ( const portalData of behaviourData.portals ) {
                                item.addPortal( portalData.type, portalData.name, portalData.value, portalData.valueType );
                            }
                        }
                    }
                    else
                        throw `Could not create behaviour: '${behaviourData.behaviourType}'`;
                }


                // Get all the link data
                const links = containerData.links;
                for ( const linkData of links ) {
                    ( <any>linkData ).container = container;
                    allLinks.push( linkData );
                }


                // Get all the Assets for this behavaiour
                const assets = containerData.assets;
                for ( const assetData of assets ) {
                    const runtimeAssets = toRet.assets;

                    for ( const runtimeAsset of runtimeAssets )
                        if ( runtimeAsset.shallowId === assetData ) {
                            container.assets.push( runtimeAsset );
                            runtimeAsset.containerRefCount++;
                            break;
                        }
                }

                // Get all the Groups for this behavaiour
                const groups = containerData.groups;
                for ( const groupData of groups ) {
                    const runtimeGroups = toRet.groups;

                    for ( const runtimeGroup of runtimeGroups )
                        if ( runtimeGroup.shallowId === groupData ) {
                            container.groups.push( runtimeGroup );
                            runtimeGroup.containerRefCount++;
                            break;
                        }
                }
            }


            // Now create each of the links
            for ( const linkData of allLinks ) {
                const containerObj: Container = ( <any>linkData ).container;
                const link: Link = new Link();
                link.id = linkData.id;
                link.frameDelay = linkData.frameDelay;

                // Now lets associate the link with the portals and behaviours
                for ( const containerBehaviour of containerObj.behaviours ) {
                    if ( linkData.startBehaviour === containerBehaviour.id ) {
                        link.startBehaviour = containerBehaviour;

                        // Now that the nodes have been set - we have to set the portals
                        const portals = link.startBehaviour.portals;
                        for ( const portal of portals ) {
                            if ( linkData.startPortal === portal.name ) {
                                link.startPortal = portal;
                                portal.links.push( link );
                                break;
                            }
                        }
                    }

                    if ( linkData.endBehaviour === containerBehaviour.id ) {
                        link.endBehaviour = containerBehaviour;

                        // Now that the nodes have been set - we have to set the portals
                        const portals = link.endBehaviour.portals;
                        for ( const portal of portals ) {
                            if ( linkData.endPortal === portal.name ) {
                                link.endPortal = portal;
                                portal.links.push( link );
                                break;
                            }
                        }
                    }
                }

                // If we could not find a behaviour it must be the main container that its linked to
                if ( link.startBehaviour === null ) {
                    link.startBehaviour = containerObj;

                    // Now that the nodes have been set - we have to set the portals
                    const portals = link.startBehaviour.portals;
                    for ( const portal of portals ) {
                        if ( linkData.startPortal === portal.name ) {
                            link.startPortal = portal;
                            portal.links.push( link );
                            break;
                        }
                    }
                }

                // If we could not find a behaviour it must be the main container that its linked to
                if ( link.endBehaviour === null ) {
                    link.endBehaviour = containerObj;

                    // Now that the nodes have been set - we have to set the portals
                    const portals = link.endBehaviour.portals;
                    for ( const portal of portals ) {
                        if ( linkData.endPortal === portal.name ) {
                            link.endPortal = portal;
                            portal.links.push( link );
                            break;
                        }
                    }
                }
            }

            const allBehaviours: Array<Behaviour> = [];

            // After the links are setup, the scene is basically ready. The last step is to expand all the instances to the containers they
            // point to.
            for ( const container of toRet.containers ) {
                for ( const behaviour of container.behaviours ) {
                    if ( behaviour instanceof InstanceBehaviour ) {
                        for ( let cii = 0, ciil = toRet.containers.length; cii < ciil; cii++ )
                            if ( toRet.containers[ cii ].id === ( <InstanceBehaviour>behaviour ).containerID ) {
                                ( <InstanceBehaviour>behaviour ).instance = <Container>toRet.containers[ cii ].clone();
                                break;
                            }
                    }
                }

                container.flatten( allBehaviours );
            }

            // Finally call initialize on all the behaviours
            for ( const behaviour of allBehaviours ) {

                // Fill in the assets for all the portals of all the behaviours. If the asset cant be found then
                // set it to null.
                for ( const param of behaviour.parameters ) {
                    if ( param.dataType === 'asset' ) {
                        const ass: Asset = toRet.getAsset( param.value );
                        if ( ass )
                            param.value = ass;
                        else
                            param.value = null;
                    }
                    else if ( param.dataType === 'group' ) {
                        const group: Group = toRet.getGroup( param.value );
                        if ( group )
                            param.value = group;
                        else
                            param.value = null;
                    }
                }

                behaviour.onInitialize();
            }

            // Cleanup any references set during the load
            if ( allLinks )
                for ( let i: number = 0, l = allLinks.length; i < l; i++ )
                    ( <any>allLinks[ i ] ).container = null;

            // Remove all assets that are not being used by any containers.
            // TODO: Turn this into option in the editor
            let toRemove = [];
            for ( const asset of toRet.assets ) {
                if ( asset.containerRefCount === 0 ) {
                    toRemove.push( asset );
                    asset.dispose();
                }
            }

            for ( const removable of toRemove )
                toRet.assets.splice( toRet.assets.indexOf( removable ), 1 );

            return toRet;
        }
    }
}
