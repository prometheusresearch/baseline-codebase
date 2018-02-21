
settings {
    nodaemon = true,
}

sync {
    default.direct,
    source = "/repo",
    target = "/app",
    exclude = {".hg", "bin"},
    delete = "running",
}

