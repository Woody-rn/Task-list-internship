package org.nikitin.tasklist.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping({"/", "/tasks/**"})
    public String index() {
        return "index";
    }
}
