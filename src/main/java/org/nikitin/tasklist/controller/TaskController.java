package org.nikitin.tasklist.controller;

import org.nikitin.tasklist.dto.TaskDto;
import org.nikitin.tasklist.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<TaskDto>> getAllTasks() {
        try {
            List<TaskDto> tasks = taskService.getAllTasks();
            return ResponseEntity.ok(tasks);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDto> getTaskById(@PathVariable String id) {
        try {
            TaskDto task = taskService.getTaskById(id);
            return task != null
                    ? ResponseEntity.ok(task)
                    : ResponseEntity.notFound().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<TaskDto>> searchTasks(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String content) {

        return ResponseEntity.ok(List.of());
    }
}
