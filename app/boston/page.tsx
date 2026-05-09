/**
 * Backward-compat redirect: the simulator used to live at /boston. It now
 * lives at /simulator and supports every city in the registry. Anyone with
 * an old bookmark lands on the simulator with Boston as the starting city.
 */
import { redirect } from "next/navigation";

export default function BostonRedirect(): never {
  redirect("/simulator");
}
