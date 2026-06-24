import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { RoleDefinition } from '../../types/user-role'
import { listRoles, updateRole } from '../store'
import type { UpdateRolePayload } from '../store'

export type { UpdateRolePayload }

/** The three role definitions (maker / checker / admin) with permission grants. */
export function useRoles() {
  return useQuery<RoleDefinition[]>({
    queryKey: ['roles'],
    queryFn:  () => listRoles(),
    staleTime: 30_000,
  })
}

/** Save a role's name, description, and permission grants. */
export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation<RoleDefinition, Error, UpdateRolePayload>({
    mutationFn: updateRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })
}
