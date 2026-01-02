package org.nikitin.tasklist.service;

import org.nikitin.tasklist.dto.TaskDto;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class TaskService {
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ResourcePatternResolver resourcePatternResolver;

    public TaskService(ResourcePatternResolver resourcePatternResolver) {
        this.resourcePatternResolver = resourcePatternResolver;
    }

    public List<TaskDto> getAllTasks() throws IOException {
        String tasksPath = "classpath:static/tasks/*.txt";
        Resource[] resources = resourcePatternResolver.getResources(tasksPath);

        return Stream.of(resources)
                .filter(Resource::exists)
                .map(this::resourceToTaskDto)
                .collect(Collectors.toList());
    }

    public TaskDto getTaskById(String id) throws IOException {
        return getAllTasks().stream()
                .filter(task -> task.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    private TaskDto resourceToTaskDto(Resource resource) {
        try {
            String fileName = resource.getFilename();
            String taskId = generateTaskId(fileName);

            TaskDto dto = new TaskDto();
            dto.setId(taskId);
            dto.setFileName(fileName);
            dto.setTitle(formatTitle(fileName));
            dto.setContent(readFileContent(resource));
            dto.setCreatedAt(getFileCreationTime(resource));

            return dto;
        } catch (IOException e) {
            throw new RuntimeException("Error reading task file", e);
        }
    }

    private String generateTaskId(String fileName) {
        return fileName.toLowerCase()
                .replace(".txt", "")
                .replaceAll("[^a-z0-9]", "-");
    }

    private String formatTitle(String fileName) {
        String nameWithoutExt = fileName.replace(".txt", "");
        return nameWithoutExt.replaceAll("[-_]", " ");
    }

    private String readFileContent(Resource resource) throws IOException {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream()))) {
            return reader.lines()
                    .collect(Collectors.joining("\n"));
        }
    }

    private String getFileCreationTime(Resource resource) throws IOException {
        try {
            Path path = Paths.get(resource.getURI());
            Instant instant = Files.getLastModifiedTime(path).toInstant();
            LocalDateTime dateTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
            return dateTime.format(DATE_FORMATTER);
        } catch (Exception e) {
            return "Unknown";
        }
    }
}
