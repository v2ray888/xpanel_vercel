export interface EdgeTunnelGroup {
  id: number
  name: string
  description: string
  api_endpoint: string
  api_key: string
  max_users: number
  is_active: number
  created_at: string
  updated_at: string
  node_count?: number
  active_node_count?: number
  user_count?: number
}

export interface EdgeTunnelNode {
  id: number
  name: string
  host: string
  port: number
  protocol: string
  group_id: number
  is_active: number
  created_at: string
  updated_at: string
  group_name?: string
}

export interface EdgeTunnelUserNode {
  id: number
  user_id: number
  group_id: number
  node_id: number
  is_active: number
  created_at: string
  updated_at: string
}

export interface GroupsResponse {
  success: boolean
  data: {
    groups: EdgeTunnelGroup[]
  }
}

export interface NodesResponse {
  success: boolean
  data: {
    nodes: EdgeTunnelNode[]
  }
}

export interface GroupResponse {
  success: boolean
  data: {
    group: EdgeTunnelGroup
  }
}

export interface NodeResponse {
  success: boolean
  data: {
    node: EdgeTunnelNode
  }
}