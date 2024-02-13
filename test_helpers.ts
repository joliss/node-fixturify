export async function removeTestDir() {
    const info = await Deno.stat("testdir.tmp");
    if (info.isDirectory) {
      await Deno.remove("testdir.tmp", { recursive: true });
    }
}
