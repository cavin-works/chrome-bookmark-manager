declare namespace chrome {
    namespace bookmarks {
        interface BookmarkTreeNode {
            id: string;
            parentId?: string;
            index?: number;
            url?: string;
            title: string;
            dateAdded?: number;
            dateGroupModified?: number;
            unmodifiable?: 'managed';
            children?: BookmarkTreeNode[];
        }

        interface BookmarkDestination {
            parentId: string;
            index?: number;
        }

        function getTree(callback: (tree: BookmarkTreeNode[]) => void): void;
        function getChildren(id: string, callback: (children: BookmarkTreeNode[]) => void): void;
        function get(idOrIdList: string | string[], callback: (results: BookmarkTreeNode[]) => void): void;
        function create(bookmark: { parentId: string; index?: number; title: string; url?: string }, callback?: (result: BookmarkTreeNode) => void): void;
        function move(id: string, destination: BookmarkDestination, callback?: (result: BookmarkTreeNode) => void): void;
        function update(id: string, changes: { title?: string; url?: string }, callback?: (result: BookmarkTreeNode) => void): void;
        function remove(id: string, callback?: () => void): void;
        function removeTree(id: string, callback?: () => void): void;
        function search(query: string, callback: (results: BookmarkTreeNode[]) => void): void;
    }

    namespace tabs {
        interface CreateProperties {
            active?: boolean;
            pinned?: boolean;
            url?: string;
            windowId?: number;
        }

        function create(createProperties: CreateProperties, callback?: (tab: any) => void): void;
    }

    namespace runtime {
        interface Port {
            name: string;
            disconnect(): void;
            postMessage(message: any): void;
            onDisconnect: {
                addListener(callback: (port: Port) => void): void;
                removeListener(callback: (port: Port) => void): void;
            };
            onMessage: {
                addListener(callback: (message: any, port: Port) => void): void;
                removeListener(callback: (message: any, port: Port) => void): void;
            };
        }

        function connect(extensionId?: string, connectInfo?: { name?: string }): Port;
        function sendMessage(message: any, callback?: (response: any) => void): void;
        function sendMessage(extensionId: string, message: any, callback?: (response: any) => void): void;
    }
}