export async function removeTestDir() {
  try {
    await Deno.remove("testdir.tmp", { recursive: true });
  } catch {}
}
