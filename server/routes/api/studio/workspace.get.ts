import { defineHandler } from "nitro";
import { getAuthenticatedUser } from "../../../lib/auth";
import { getStudioWorkspace } from "../../../lib/production-studio";

export default defineHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event);
  const workspace = await getStudioWorkspace(authUser);

  return {
    ok: true,
    workspace,
  };
});
